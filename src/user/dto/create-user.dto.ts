import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator'
import { Role } from '@prisma/client'

export class CreateUserDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  name: string

  @ApiProperty({ example: 'budi@gacoan.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string

  @ApiProperty({ enum: Role, example: Role.resto })
  @IsEnum(Role)
  role: Role

  @ApiPropertyOptional({ description: 'Wajib jika role = resto atau cabang' })
  @IsNumber()
  @IsOptional()
  restaurantId?: number

  @ApiPropertyOptional({ example: 'Gacoan Malang' })
  @IsString()
  @IsOptional()
  restaurantName?: string

  @ApiPropertyOptional({ description: 'Wajib jika role = cabang' })
  @IsOptional()
  branchId?: number

  @ApiPropertyOptional({ example: 'Gacoan Malang' })
  @IsString()
  @IsOptional()
  branchName?: string

  @ApiPropertyOptional({ example: 'Jl. Soekarno Hatta No. 1' })
  @IsString()
  @IsOptional()
  branchAddress?: string
}
