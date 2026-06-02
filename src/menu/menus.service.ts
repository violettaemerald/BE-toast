import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { doesNotReject } from 'assert';

@Injectable()
export class MenuService {
  constructor (private prisma: PrismaService) {}

  async findAllCategories (requestingUser: any) {
    const where =
      requestingUser.role === 'admin'
        ? {}
        : { restaurantId: requestingUser.restaurantId }

    return this.prisma.category.findMany({
      where,
      select: {
        id: true,
        name: true,
        sortOrder: true,
        _count: { select: { menus: true } },
      },

      orderBy: { sortOrder: 'asc' },
    })
  }

  async createCategory (dto: CreateCategoryDto, requestingUser: any) {
    if (requestingUser.role !== 'resto') {
      throw new ForbiddenException('Hanya resto yang bisa membuat kategori!')
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        sortOrder: dto.sortOrder ?? 0,
        restaurantId: requestingUser.restaurantId,
      },
      select: { id: true, name: true, sortOrder: true },
    })

    return { message: 'kategori berhasil dibuat!', ...category }
  }

  async updateCategory (
    id: number,
    dto: UpdateCategoryDto,
    requestingUser: any,
  ) {
    const category = await this.prisma.category.findUnique({ where: { id } })
    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan!')
    }

    if (
      requestingUser.role === 'resto' &&
      category.restaurantId !== requestingUser.restaurantId
    ) {
      throw new ForbiddenException('Tidak punya akses ke kategori ini!')
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { name: dto.name, sortOrder: dto.sortOrder },
      select: { id: true, name: true, sortOrder: true },
    })

    return { message: 'Kategori berhasil diupdate!', ...updated }
  }

  async removeCategory (id: number, requestingUser: any) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { menus: true } } },
    })

    if (!category) {
      throw new NotFoundException('Kategori tidak ditemukan!')
    }

    if (category._count.menus > 0) {
      throw new BadRequestException('Kategori masih memiliki menu!')
    }

    if (
      requestingUser.role == 'resto' &&
      category.restaurantId !== requestingUser.restaurantId
    ) {
      throw new ForbiddenException('Tidak punya akses ke kategori ini!')
    }

    await this.prisma.category.delete({ where: { id } })
    return { message: 'kategori berhasil dihapus!' }
  }

  //menu

  async findAllMenus (requestingUser: any, categoryId?: number) {
    const where: any = {}

    if (requestingUser.role === 'admin') {
      if (categoryId) where.categoryId = categoryId
    } else {
      where.restaurantId = requestingUser.restaurantId
      if (categoryId) where.categoryId = categoryId
    }

    return this.prisma.menu.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        extraFee: true,
        extraFeeLabel: true,
        isAvailable: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneMenu (id: number, requestingUser: any) {
    const menu = await this.prisma.menu.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        price: true,
        extraFee: true,
        extraFeeLabel: true,
        isAvailable: true,
        status: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        restaurant: { select: { id: true, name: true } },
      },
    })

    if (!menu) throw new NotFoundException('Menu tidak ditemukan!')

    if (
      requestingUser.role !== 'admin' &&
      menu.restaurant.id !== requestingUser.restaurantId
    ) {
      throw new ForbiddenException('Tidak punya akses!')
    }
    return menu
  }

  async createMenu (dto: CreateMenuDto, requestingUser: any) {
    if (requestingUser.role !== 'resto') {
      throw new ForbiddenException('Hanya resto yang bisa membuat menu!')
    }
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId},
      })
      
      if (!category) throw new NotFoundException('Kategori tidak ditemukan!')
      if (category.restaurantId !== requestingUser.restaurantId) {
        throw new ForbiddenException('Kategori ini bukan milik restoran anda!')
      }
    }

    const menu = await this.prisma.menu.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        extraFee: dto.extraFee ?? 0,
        extraFeeLabel: dto.extraFeeLabel ?? null,
        categoryId: dto.categoryId ?? null,
        restaurantId: requestingUser.restaurantId,
        status: 'pending',
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        extraFee: true,
        extraFeeLabel: true,
        status: true,
        createdAt: true,
      },
    })

    return {
      data: menu,
      message: 'Menu berhasil dibuat, pendinga pproval admin...',
    }
  }

  async updateMenu (id: number, dto: UpdateMenuDto, requestingUser: any) {
    await this.findOneMenu(id, requestingUser)

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId},
      })
      
      if (!category) throw new NotFoundException('Kategori tidak ditemukan!')
      if (category.restaurantId !== requestingUser.restaurantId) {
        throw new ForbiddenException('Kategori ini bukan milik restoran anda!')
      }
    }

    const updated = await this.prisma.menu.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        extraFee: dto.extraFee,
        extraFeeLabel: dto.extraFeeLabel,
        categoryId: dto.categoryId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        extraFee: true,
        extraFeeLabel: true,
        isAvailable: true,
        status: true,
      },
    })

    return { message: 'Menu berhasil diupdate!', ...updated }
  }

  async updateMenuStatus (
    id: number,
    status: 'active' | 'rejected',
    requestingUser: any,
  ) {
    if (requestingUser.role !== 'admin') {
      throw new ForbiddenException('Hanya admin yang bisa approve/reject menu!')
    }

    const menu = await this.prisma.menu.findUnique({ where: { id } })
    if (!menu) throw new NotFoundException('Menu tidak ditemukan!')
    if (menu.status !== 'pending') {
      throw new BadRequestException(
        'Hanya menu dengan status pending yang bisa di-approve/reject!',
      )
    }

    const updated = await this.prisma.menu.update({
      where: { id },
      data: { status },
      select: { id: true, name: true, status: true },
    })

    return {
      message:
        status === 'active'
          ? 'Menu berhasil di-approve!'
          : 'Menu berhasil di-reject!',
      ...updated,
    }
  }

  async toggleAvailability (id: number, requestingUser: any) {
    if (requestingUser.role !== 'cabang') {
      throw new ForbiddenException(
        'Hanya cabang yang bisa toggle ketersediaan menu!',
      )
    }

    const menu = await this.prisma.menu.findUnique({ where: { id } })
    if (!menu) throw new NotFoundException('Menu tidak ditemukan!')

    const updated = await this.prisma.menu.update({
      where: { id },
      data: { isAvailable: !menu.isAvailable },
      select: { id: true, name: true, isAvailable: true },
    })

    return {
      message: `Menu ${updated.isAvailable ? 'tersedia' : 'tidak tersedia'}!`,
      ...updated,
    }
  }

  async updateMenuImage (id: number, url: string, requestingUser: any) {
    await this.findOneMenu(id, requestingUser)

    const updated = await this.prisma.menu.update({
      where: { id },
      data: { imageUrl: url },
      select: { id: true, name: true, imageUrl: true },
    })

    return { message: 'Foto menu berhasil diupload!', ...updated }
  }

  async removeMenu (id: number, requestingUser: any) {
    await this.findOneMenu(id, requestingUser)

    await this.prisma.menu.delete({ where: { id } })

    return { message: 'Menu berhasil dihapus!' }
  }
}
