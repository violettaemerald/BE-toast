import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, Request,
} from '@nestjs/common'
import {
  ApiTags, ApiOperation, ApiBearerAuth, ApiParam,
} from '@nestjs/swagger'
import { TableService } from './table.service'
import { CreateTableDto } from './dto/create-table.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorators'

@ApiTags('Table QR')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tables')
export class TableController {
  constructor (private tablesService: TableService) {}

  @Get()
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'List semua meja' })
  findAll (@Request() req) {
    return this.tablesService.findAll(req.user)
  }

  @Get(':id')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'Detail meja by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  findOne (@Param('id') id: string, @Request() req) {
    return this.tablesService.findOne(+id, req.user)
  }

  @Post()
  @Roles('cabang')
  @ApiOperation({ summary: 'Generate QR meja baru' })
  create (@Body() dto: CreateTableDto, @Request() req) {
    return this.tablesService.create(dto, req.user)
  }

  @Patch(':id/status')
  @Roles('admin', 'cabang')
  @ApiOperation({ summary: 'Toggle aktif/nonaktif meja' })
  @ApiParam({ name: 'id', type: 'number' })
  toggleStatus (@Param('id') id: string, @Request() req) {
    return this.tablesService.toggleStatus(+id, req.user)
  }

  @Delete(':id')
  @Roles('admin', 'cabang')
  @ApiOperation({ summary: 'Hapus meja' })
  @ApiParam({ name: 'id', type: 'number' })
  remove (@Param('id') id: string, @Request() req) {
    return this.tablesService.remove(+id, req.user)
  }
}