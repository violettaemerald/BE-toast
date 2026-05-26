import { ApiProperty } from '@nestjs/swagger';
import {IsEnum} from 'class-validator';

export class UpdateStatusDto {
    @ApiProperty({ enum: ['active', 'suspended']})
    @IsEnum(['active', 'suspended'])
    status!: 'active' | 'suspended'
}