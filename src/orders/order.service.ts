import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { Cron } from '@nestjs/schedule'
import { BranchStatus } from '@prisma/client'
import { isAlpha } from 'class-validator'

@Injectable()
export class OrderService {
  constructor (private prisma: PrismaService) {}

  async create (dto: CreateOrderDto) {
    const table = await this.prisma.tableQr.findUnique({
      //validate qr
      where: { qrToken: dto.qrToken },
      include: {
        branch: {
          include: { restaurant: true },
        },
      },
    })

    if (!table) throw new NotFoundException('QR Tidak valid!')
    if (!table.isActive) throw new BadRequestException('QR meja tidak aktif!')
    if (table.branch.status === 'suspended')
      throw new BadRequestException('Cabang sedang ditutup!')
    if (table.branch.restaurant.status === 'suspended')
      throw new BadRequestException('Resto sedang ditutup!')

    const menuIds = dto.items.map(i => i.menuId)
    const menus = await this.prisma.menu.findMany({
      where: { id: { in: menuIds } },
    })

    if (menus.length !== menuIds.length) {
      throw new NotFoundException('Satu atau lebih menu tidak ditemukan!')
    }

    for (const menu of menus) {
      if (menu.status !== 'active') {
        throw new BadRequestException(`Menu "${menu.name}" tidak tersedia!`)
      }
      if (!menu.isAvailable) {
        throw new BadRequestException(`Menu "${menu.name}" sedang habis!`)
      }
      if (menu.restaurantId !== table.branch.restaurantId) {
        throw new BadRequestException(
          `Menu "${menu.name}" bukan milik resto ini!`,
        )
      }
    }

    const menuMap = new Map(menus.map(m => [m.id, m]))
    let grandTotal = 0

    const orderItems = dto.items.map(item => {
      const menu = menuMap.get(item.menuId)!
      const unitPrice = Number(menu.price) + Number(menu.extraFee)
      const subtotal = unitPrice * item.quantity
      grandTotal += subtotal

      return {
        menuId: menu.id,
        menuName: menu.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      }
    })

    const expiredAt = new Date()
    expiredAt.setMinutes(expiredAt.getMinutes() + 15)

    const order = await this.prisma.$transaction(async tx => {
      const newOrder = await tx.order.create({
        data: {
          branchId: table.branchId,
          tableQrId: table.id,
          tableNumber: table.tableNumber,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          paymentMethod: dto.paymentMethod,
          grandTotal,
          status: 'waiting_payment',
          expiredAt,
          orderItems: {
            create: orderItems,
          },
        },
        select: {
          id: true,
          qrCode: true,
          grandTotal: true,
          expiredAt: true,
          tableNumber: true,
          status: true,
          orderItems: true,
        },
      })

      return newOrder
    })
    return {
      message: 'Order berhasil dibuat! Silakan lakukan pembayaran.',
      orderId: order.id,
      qrCode: order.qrCode,
      grandTotal: order.grandTotal,
      expiredAt: order.expiredAt,
      tableNumber: order.tableNumber,
      items: order.orderItems,
    }
  }

  async findOnePublic (id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        grandTotal: true,
        paymentMethod: true,
        paymentStatus: true,
        tableNumber: true,
        guestName: true,
        expiredAt: true,
        createdAt: true,
        qrCode: true,
        orderItems: {
          select: {
            menuName: true,
            unitPrice: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
    })

    if (!order) throw new NotFoundException('Order tidak ditemukan!')
    return order
  }

  async findAll (requestingUser: any, status?: string) {
    const where: any = {
      status: { not: 'waiting_payment' },
    }

    if (requestingUser.role === 'cabang') {
      where.branchId = requestingUser.branchId
    } else if (requestingUser.role === 'resto') {
      where.branch = { restaurantId: requestingUser.restaurantId }
    }

    if (status) where.status = status

    return this.prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        grandTotal: true,
        paymentMethod: true,
        paymentStatus: true,
        tableNumber: true,
        guestName: true,
        guestPhone: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
        orderItems: {
          select: {
            menuName: true,
            unitPrice: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async updateStatus (
    id: number,
    dto: UpdateOrderStatusDto,
    requestingUser: any,
  ) {
    if (requestingUser.role !== 'cabang') {
      throw new ForbiddenException(
        'Hanya cabang yang bisa update status order!',
      )
    }

    const order = await this.prisma.order.findUnique({ where: { id } })
    if (!order) throw new NotFoundException('Order tidak ditemukan!')

    if (order.branchId !== requestingUser.branchId) {
      throw new ForbiddenException('Order ini bukan milik cabang kamu!')
    }

    if (order.status === 'waiting_payment') {
      throw new BadRequestException('Order belum dibayar!')
    }
    if (order.status === 'completed' || order.status === 'cancelled') {
      throw new BadRequestException('Order sudah selesai atau dibatalkan!')
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, status: true, tableNumber: true },
    })

    return {
      message: `Status order berhasil diubah ke ${dto.status}!`,
      ...updated,
    }
  }

  async confirmPayment (qrCode: string, requestingUser: any) {
    if (requestingUser.role !== 'cabang') {
      throw new ForbiddenException(
        'Hanya cabang yang bisa konfirmasi pembayaran!',
      )
    }

    const order = await this.prisma.order.findUnique({
      where: { qrCode },
      select: {
        id: true,
        branchId: true,
        status: true,
        expiredAt: true,
      },
    })

    if (!order) throw new NotFoundException('QR order tidak valid!')
    if (order.branchId !== requestingUser.branchId) {
      throw new ForbiddenException('Order ini bukan milik cabang kamu!')
    }
    if (order.status !== 'waiting_payment') {
      throw new BadRequestException('Order ini sudah dibayar atau dibatalkan!')
    }
    if (order.expiredAt && new Date() > new Date(order.expiredAt)) {
      throw new BadRequestException('Order sudah expired!')
    }

    const updated = await this.prisma.order.update({
      where: { qrCode },
      data: {
        status: 'pending',
        paymentStatus: 'paid',
        expiredAt: null,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        tableNumber: true,
      },
    })

    return {
      message: 'Pembayaran dikonfirmasi! Order masuk ke antrian.',
      ...updated,
    }
  }

  @Cron('*/1 * * * *')
  async cancelExpiredOrders () {
    await this.prisma.order.updateMany({
      where: {
        status: 'waiting_payment',
        expiredAt: { lt: new Date() },
      },
      data: { status: 'cancelled' },
    })
  }

  async getMenuByToken (token: string, categoryId?: number) {
    const table = await this.prisma.tableQr.findUnique({
      where: { qrToken: token },
      include: {
        branch: {
          include: { restaurant: true },
        },
      },
    })

    if (!table) throw new NotFoundException('QR tidak valid!')
    if (!table.isActive) throw new BadRequestException('QR meja tidak aktif!')
    if (table.branch.status === 'suspended')
      throw new BadRequestException('Cabang sedang tutup!')
    if (table.branch.restaurant.status === 'suspended')
      throw new BadRequestException('Resto sedang tutup!')

    const where: any = {
      restaurantId: table.branch.restaurantId,
      status: 'active',
      isAvailable: true,
    }
    if (categoryId) where.categoryId = categoryId

    const menus = await this.prisma.menu.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        extraFee: true,
        extraFeeLabel: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    })

    return {
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        branch: table.branch.name,
        restaurant: table.branch.restaurant.name,
      },
      menus,
    }
  }
}
