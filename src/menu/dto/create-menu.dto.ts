import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CreateMenuDto {
  @ApiProperty({ example: 'Mie level 5' })
  @IsString()
  name: string

  @ApiPropertyOptional({ example: 'Mie ala gacoan yang super pedas' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  extraFee?: number

  @ApiPropertyOptional({ example: 'Biaya kemasan' })
  @IsString()
  @IsOptional()
  extraFeeLabel?: string

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  categoryId?: number
}
