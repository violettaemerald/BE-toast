import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBranchDto {
    @ApiPropertyOptional({example: 'Gacoan Malang'})
    @IsString()
    @IsOptional()
    name?: string

    @ApiPropertyOptional({example: 'Jl Soekarno Hatta no 1'})
    @IsString()
    @IsOptional()
    address?: string
}