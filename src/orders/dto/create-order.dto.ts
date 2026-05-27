import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsInt, IsString, Min, ValidateNested } from 'class-validator'

export class OrderItemDto {
    @ApiProperty({ example: 1 })
    @IsInt()
    @Type(() => Number)
    menuId: number

    @ApiProperty({ example: 2 })
    @Min(1)
    @Type(() => Number)
    quantity: number
}

export class CreateOrderDto {
    @ApiProperty({ example: 'abc123' })
    @IsString()
    qrToken: string

    @ApiProperty({ example: 'Violet'})
    @IsString()
    guestName: string
    
    @ApiProperty({ example: '08123456789' })
    @IsString()
    guestPhone: string

    @ApiProperty({ enum: ['cash', 'cashless']})
    @IsEnum(['cash', 'cashless'])
    paymentMethod: 'cash' | 'cashless'

    @ApiProperty({ type: [OrderItemDto]})
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[]
}