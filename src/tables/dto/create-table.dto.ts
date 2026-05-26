import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTableDto {
    @ApiProperty({example: 1})
    @IsInt()
    @Min(1)
    @Type(() => Number)
    tableNumber: number
}