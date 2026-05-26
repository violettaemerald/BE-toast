import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateTableDto } from './dto/create-table.dto'
import { nanoid } from 'nanoid'

@Injectable()
export class TableService {
  constructor (private prisma: PrismaService) {}

  async findAll (requestingUser: any) {
    const where =
      requestingUser.role === 'admin'
        ? {}
        : requestingUser.role === 'resto'
        ? { branch: { restaurantId: requestingUser.restaurantId } }
        : { branchId: requestingUser.branchId }

    return this.prisma.tableQr.findMany({
      where,
      select: {
        id: true,
        tableNumber: true,
        qrToken: true,
        isActive: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { tableNumber: 'asc' },
    })
  }

  async findOne (id: number, requestingUser: any) {
    const table = await this.prisma.tableQr.findUnique({
      where: { id },
      select: {
        id: true,
        tableNumber: true,
        qrToken: true,
        isActive: true,
        createdAt: true,
        branch: { select: { id: true, name: true, restaurantId: true } },
      },
    })

    if (!table) throw new NotFoundException('Meja tidak ditemukan!')

    if (
      requestingUser.role === 'cabang' &&
      table.branch.id !== requestingUser.branchId
    ) {
      throw new ForbiddenException('Tidak punya akses ke meja ini!')
    }
    if (
      requestingUser.role === 'resto' &&
      table.branch.restaurantId !== requestingUser.branchId
    ) {
      throw new ForbiddenException('Tidak punya akses ke meja ini!')
    }

    return table
  }

  async create (dto: CreateTableDto, requestingUser: any) {
    if (requestingUser.role !== 'cabang') {
      throw new ForbiddenException('Hanya cabang yang bisa membuat QR meja!')
    }

    const existing = await this.prisma.tableQr.findFirst({
      where: {
        branchId: requestingUser.branchId,
        tableNumber: dto.tableNumber,
      },
    })

    if (existing)
      throw new BadRequestException(`Meja nomor ${dto.tableNumber} sudah ada!`)

    const table = await this.prisma.tableQr.create({
      data: {
        branchId: requestingUser.branchId,
        tableNumber: dto.tableNumber,
        qrToken: nanoid(16),
        isActive: true,
      },
      select: {
        id: true,
        tableNumber: true,
        qrToken: true,
        isActive: true,
        createdAt: true,
      },
    })

    return { message: 'QR meja berhasil dibuat!', ...table }
  }

  async toggleStatus (id: number, requestingUser: any) {
    const table = await this.findOne(id, requestingUser)

    const updated = await this.prisma.tableQr.update({
      where: { id },
      data: { isActive: !table.isActive },
      select: { id: true, tableNumber: true, isActive: true },
    })

    return {
      message: `Meja ${updated.isActive ? 'diaktifkan' : 'dinonaktifkan'}!`,
      ...updated,
    }
  }

  async remove (id: number, requestingUser: any) {
    await this.findOne(id, requestingUser)

    await this.prisma.tableQr.delete({ where: { id } })
    return { message: 'Meja berhasil dihapus!' }
  }

  async validateToken (token: string) {
    const table = await this.prisma.tableQr.findUnique({
        where: { qrToken: token },
        select: {
            id: true, tableNumber: true, isActive: true,
            branch: {
                select: {
                    id: true, name: true, status:true,
                    restaurant: {select: {id: true, name: true, status: true}},
                },
            },
        },
    })

    if (!table) throw new NotFoundException('QR Tidak valid!')
    if (!table.isActive) throw new BadRequestException('QR Meja tidak aktif!')
    if (table.branch.status === 'suspended') throw new BadRequestException('Cabang ini sedang tutup!')
    if (table.branch.restaurant.status === 'suspended') throw new BadRequestException('Resto ini sedang tutup!')

    return table
  }
}
