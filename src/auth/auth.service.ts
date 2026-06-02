import { Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor (private prisma: PrismaService, private jwtService: JwtService) {}

  async login (dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    if (!user) {
      throw new UnauthorizedException('Akun tidak terdaftar!')
    }
    if (user.status === 'suspended') {
      throw new UnauthorizedException('Akunmu di-suspend!')
    }
    if (user.branchId) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: user.branchId },
      })
      if (branch?.status === 'suspended') {
        throw new UnauthorizedException('Cabang kamu di-suspend!')
      }
    }

    // cek restaurant suspended
    if (user.restaurantId) {
      const restaurant = await this.prisma.restaurant.findUnique({
        where: { id: user.restaurantId },
      })
      if (restaurant?.status === 'suspended') {
        throw new UnauthorizedException('Restoran kamu di-suspend!')
      }
    }
    const isMatch = await bcrypt.compare(dto.password, user.password)
    if (!isMatch) {
      throw new UnauthorizedException('Email atau password salah!')
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    })

    return {
      access_token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        restaurantId: user.restaurantId,
        branchId: user.branchId,
      },
    }
  }

  async me (userId: number) {
    return this.prisma.user.findUnique({
      where: { id: userId },
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
}
