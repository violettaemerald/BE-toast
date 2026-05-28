import { ApiProperty } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'

export class UpdateMenuStatusDto {
  @ApiProperty({ enum: ['active', 'rejected'] })
  @IsEnum(['active', 'rejected'])
  status!: 'active' | 'rejected'
}