import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { CreateUserDto } from './dto/create-user.dto'
import {
  UpdateUserDto,
  UpdateStatusDto,
  UpdatePasswordDto,
} from './dto/update-user.dto'
import * as bcrypt from 'bcrypt'
import { Prisma } from '@prisma/client'

@Injectable()
export class UserService {
  constructor (private prisma: PrismaService) {}

  private async validateRoleFk (dto: CreateUserDto) {
    if (dto.role === 'resto' || dto.role === 'cabang') {
      if (!dto.restaurantId) {
        throw new BadRequestException(
          'restaurantId wajib untuk akun resto dan cabang!',
        )
      }
      const resto = await this.prisma.restaurant.findUnique({
        where: { id: dto.restaurantId },
      })

      if (!resto) throw new NotFoundException('Restaurant tidak ditemukan!')
    }

    if (dto.role === 'cabang') {
      if (!dto.branchId) {
        throw new NotFoundException('branchId wajib untuk akun cabang!')
      }
      const branch = await this.prisma.branch.findUnique({
        where: { id: dto.branchId },
      })

      if (!branch) throw new NotFoundException('Branch tidak ditemukan!')

      if (branch.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(
          'Branch ini tidak termasuk restaurant tersebut!',
        )
      }
    }
  }

  async create (dto: CreateUserDto, requestingUser: any) {
    if (requestingUser.role === 'admin' && dto.role !== 'resto') {
      throw new ForbiddenException('Admin hanya bisa membuat akun resto!')
    }

    if (requestingUser.role === 'resto') {
      if (dto.role !== 'cabang') {
        throw new ForbiddenException('Resto hanya bisa membuat akun cabang!')
      }
      dto.restaurantId = requestingUser.restaurantId
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new BadRequestException('email sudah digunakan!')

    const hashed = await bcrypt.hash(dto.password, 10)

    if (requestingUser.role === 'admin' && dto.role === 'resto') {
      if (!dto.restaurantName) {
        throw new BadRequestException('restaurantName wajib untuk role resto!')
      }

      const result = await this.prisma.$transaction(async tx => {
        const restaurant = await tx.restaurant.create({
          data: {
            name: dto.restaurantName!,
            status: 'active',
          },
        })

        const user = await tx.user.create({
          data: {
            name: dto.name,
            email: dto.email,
            password: hashed,
            role: dto.role,
            restaurantId: restaurant.id,
            branchId: null,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            restaurantId: true,
            branchId: true,
            createdAt: true,
          },
        })
        return { restaurant, user }
      })

      return {
        statusCode: 201,
        success: true,
        message: 'Akun resto dan restaurant berhasil dibuat!',
        userId: result.user.id,
        userName: result.user.name,
        userEmail: result.user.email,
        restaurantId: result.restaurant.id,
        restaurantName: result.restaurant.name,
      }
    }

    if (requestingUser.role === 'resto' && dto.role === 'cabang') {
      if (!dto.branchName) {
        throw new BadRequestException(
          'branchName wajib saat membuat akun cabang!',
        )
      }

      const result = await this.prisma.$transaction(async tx => {
        const branch = await tx.branch.create({
          data: {
            restaurantId: requestingUser.restaurantId,
            name: dto.branchName!,
            address: dto.branchAddress ?? null,
            status: 'active',
          },
        })

        const user = await tx.user.create({
          data: {
            name: dto.name,
            email: dto.email,
            password: hashed,
            role: 'cabang',
            restaurantId: requestingUser.restaurantId,
            branchId: branch.id,
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            restaurantId: true,
            branchId: true,
            createdAt: true,
          },
        })
        return { branch, user }
      })

      return {
        message: 'Akun cabang dan branch berhasil dibuat!',
        user: result.user,
        branch: result.branch,
      }
    }

    await this.validateRoleFk(dto)

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
        role: dto.role,
        restaurantId: dto.restaurantId ?? null,
        branchId: dto.branchId ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        restaurantId: true,
        branchId: true,
        createdAt: true,
      },
    })

    return { message: 'User berhasil dibuat!', ...user }
  }

  async findAll (requestingUser: any, type?: string) {
    if (requestingUser.role === 'admin') {
      const where: Prisma.UserWhereInput =
        type === 'admin'
          ? { role: 'admin' }
          : type === 'resto'
          ? { role: 'resto' }
          : { role: { in: ['admin', 'resto'] } }

      return this.prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          restaurantId: true,
          branchId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (requestingUser.role === 'resto') {
      return this.prisma.user.findMany({
        where: {
          restaurantId: requestingUser.restaurantId,
          role: 'cabang',
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          restaurantId: true,
          branchId: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    }

    if (requestingUser.role === 'cabang') {
      return this.prisma.user.findUnique({
        where: { id: requestingUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          restaurantId: true,
          branchId: true,
          createdAt: true,
        },
      })
    }

    throw new ForbiddenException('Tidak punya akses')
  }

  async findOne (id: number, requestingUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        restaurantId: true,
        branchId: true,
        createdAt: true,
      },
    })

    if (!user) throw new NotFoundException('User tidak ditemukan')

    if (
      requestingUser.role === 'resto' &&
      user.restaurantId !== requestingUser.restaurantId
    ) {
      throw new ForbiddenException('Tidak punya akses ke user ini')
    }

    return user
  }

  async update (id: number, dto: UpdateUserDto, requestingUser: any) {
    await this.findOne(id, requestingUser)

    const updated = await this.prisma.user.update({
      where: { id },
      data: { name: dto.name, email: dto.email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        restaurantId: true,
        branchId: true,
      },
    })

    return { message: 'User berhasil diupdate', ...updated }
  }

  async updateStatus (id: number, dto: UpdateStatusDto, requestingUser: any) {
    await this.findOne(id, requestingUser)

    if (id === requestingUser.id) {
      throw new BadRequestException('Tidak bisa suspend akun sendiri')
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: { id: true, name: true, email: true, status: true },
    })

    return {
      message: `Status user berhasil diubah menjadi ${dto.status}`,
      ...updated,
    }
  }

  async updatePassword (
    id: number,
    dto: UpdatePasswordDto,
    requestingUser: any,
  ) {
    if (requestingUser.role !== 'admin' && requestingUser.id !== id) {
      throw new ForbiddenException(
        'Hanya admin yang bisa reset password user lain',
      )
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10)

    await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    })

    return { message: 'Password berhasil direset' }
  }

  async remove (id: number, requestingUser: any) {
    await this.findOne(id, requestingUser)

    if (id === requestingUser.id) {
      throw new BadRequestException('Tidak bisa hapus akun sendiri')
    }

    await this.prisma.user.delete({ where: { id } })

    return { message: 'User berhasil dihapus' }
  }
}
