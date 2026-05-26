import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRestaurantDto {
    @ApiPropertyOptional({example: 'Gacoan'})
    @IsString()
    @IsOptional()
    name?: string

    @ApiPropertyOptional({example: 'Resto mies pedas terenak'})
    @IsString()
    @IsOptional()
    description?: string

    @ApiPropertyOptional({example:'https://cloudinary.com/logo.png' })
    @IsString()
    @IsOptional()
    logoUrl?: string
}