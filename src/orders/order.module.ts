import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { OrderController } from './order.controller'
import { OrderService } from './order.service'

@Module({
  imports:     [ScheduleModule.forRoot()],
  controllers: [OrderController],
  providers:   [OrderService],
})
export class OrderModule {}