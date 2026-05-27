import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: ['processing', 'ready', 'cancelled'] })
  @IsEnum(['processing', 'ready', 'cancelled'])
  status!: 'processing' | 'ready' | 'cancelled'
}