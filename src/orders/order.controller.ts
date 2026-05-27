// src/orders/orders.controller.ts
import {
  Controller, Get, Post, Patch,
  Param, Body, Query, UseGuards, Request,
} from '@nestjs/common'
import {
  ApiTags, ApiOperation, ApiBearerAuth,
  ApiParam, ApiQuery,
} from '@nestjs/swagger'
import { OrderService } from './order.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderStatusDto } from './dto/update-order-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorators'

@ApiTags('Orders')
@Controller()
export class OrderController {
  constructor (private ordersService: OrderService) {}

  // public
  @Post('store/orders')
  @ApiOperation({ summary: 'Buat order baru (guest)' })
  create (@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto)
  }

  @Get('store/orders/:id')
  @ApiOperation({ summary: 'Cek status order (guest, polling)' })
  @ApiParam({ name: 'id', type: 'number' })
  findOnePublic (@Param('id') id: string) {
    return this.ordersService.findOnePublic(+id)
  }

  @Patch('store/orders/pay/:qrCode')
  @ApiOperation({ summary: 'Konfirmasi pembayaran cash (scan QR order)' })
  @ApiParam({ name: 'qrCode', type: 'string' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cabang')
  confirmPayment (@Param('qrCode') qrCode: string, @Request() req) {
    return this.ordersService.confirmPayment(qrCode, req.user)
  }

  // internal
  @Get('orders')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'List order masuk' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'] })
  findAll (@Request() req, @Query('status') status?: string) {
    return this.ordersService.findAll(req.user, status)
  }

  @Patch('orders/:id/status')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('cabang')
  @ApiOperation({ summary: 'Update status order (cabang only)' })
  @ApiParam({ name: 'id', type: 'number' })
  updateStatus (
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    return this.ordersService.updateStatus(+id, dto, req.user)
  }
}