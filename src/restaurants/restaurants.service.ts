import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { UpdateBranchDto } from './dto/update-branch.dto'
import { UpdateStatusDto } from './dto/update-status.dto'

@Injectable()
export class RestaurantService {
  constructor (private prisma: PrismaService) {}

  async findAllRestaurants () {
    return this.prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        status: true,
        createdAt: true,
        _count: { select: { branches: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneRestaurant (id: number, requestingUser: any) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        status: true,
        createdAt: true,
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
    })

    if (!restaurant) throw new NotFoundException('Restaurant tidak ditemukan!')

    if (requestingUser.role === 'resto' && requestingUser.restaurantId !== id) {
      throw new ForbiddenException('tidak punya akses ke restaurant ini!')
    }

    return restaurant
  }

  async updateRestaurant (
    id: number,
    dto: UpdateRestaurantDto,
    requestingUser: any,
  ) {
    await this.findOneRestaurant(id, requestingUser)

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        logoUrl: dto.logoUrl,
      },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        status: true,
        createdAt: true,
      },
    })

    return { message: 'Restaurant berhasil diupdate!', ...updated }
  }

  async updateRestaurantStatus (
    id: number,
    dto: UpdateStatusDto,
    requestingUser: any,
  ) {
    await this.findOneRestaurant(id, requestingUser)

    const updated = await this.prisma.restaurant.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, name: true, status: true },
    })

    return {
      message: `Status restaurant berhasil diubah menjadi ${dto.status}!`,
      ...updated,
    }
  }

  async removeRestaurant (id: number, requestingUser: any) {
    await this.findOneRestaurant(id, requestingUser)

    await this.prisma.restaurant.delete({ where: { id } })

    return { message: 'Restaurant berhasil dihapus!' }
  }

  // branch/cabang

  async findAllBranches (requestingUser: any) {
    const where =
      requestingUser.role === 'admin'
        ? {}
        : { restaurantId: requestingUser.restaurantId }

    return this.prisma.branch.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        createdAt: true,
        restaurant: { select: { id: true, name: true } },
      },

      orderBy: { createdAt: 'desc' },
    })
  }

  async findOneBranch (id: number, requestingUser: any) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        createdAt: true,
        restaurant: { select: { id: true, name: true } },
      },
    })

    if (!branch) throw new NotFoundException('Branch tidak ditemukan!')

    if (
      requestingUser.role === 'resto' &&
      branch.restaurant.id !== requestingUser.restaurantId
    ) {
      throw new ForbiddenException('Tidak punya akses ke branch ini!')
    }
    return branch
  }

  async updateBranch (id: number, dto: UpdateBranchDto, requestingUser: any) {
    await this.findOneBranch(id, requestingUser)

    const updated = await this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
      },
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
        createdAt: true,
      },
    })

    return { message: 'Branch berhasil diupdate!', ...updated }
  }

  async updateBranchStatus (
    id: number,
    dto: UpdateStatusDto,
    requestingUser: any,
  ) {
    await this.findOneBranch(id, requestingUser)

    const updated = await this.prisma.branch.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, name: true, status: true },
    })

    return {
      message: `Status branch berhasil diubah menjadi ${dto.status}!`,
      ...updated,
    }
  }

  async removeBranch (id: number, requestingUser: any) {
    await this.findOneBranch(id, requestingUser)

    await this.prisma.branch.delete({ where: { id } })

    return { message: 'Branch berhasil dihapus!' }
  }
}
