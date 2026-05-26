import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import { CreateUserDto } from './dto/create-user.dto'
import {
  UpdateUserDto,
  UpdateStatusDto,
  UpdatePasswordDto,
} from './dto/update-user.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorators'

@ApiTags('Users')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor (private usersService: UserService) {}

  @Post()
  @Roles('admin', 'resto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Buat akun user baru' })
  @ApiResponse({ status: 201, description: 'User berhasil dibuat' })
  @ApiResponse({ status: 400, description: 'Validasi gagal / email duplikat' })
  @ApiResponse({ status: 403, description: 'Role tidak diizinkan' })
  create (@Body() dto: CreateUserDto, @Request() req) {
    return this.usersService.create(dto, req.user)
  }

  @Get('admin')
  @Roles('admin')
  @ApiOperation({ summary: 'List semua akun admin' })
  @ApiResponse({ status: 200, description: 'List admin berhasil diambil' })
  findAllAdmin (@Request() req) {
    return this.usersService.findAll(req.user, 'admin')
  }

  @Get('resto')
  @Roles('admin')
  @ApiOperation({ summary: 'List semua akun resto' })
  @ApiResponse({ status: 200, description: 'List resto berhasil diambil' })
  findAllResto (@Request() req) {
    return this.usersService.findAll(req.user, 'resto')
  }

  @Get('cabang')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'List akun cabang (admin: semua, resto: miliknya)' })
  @ApiResponse({ status: 200, description: 'List cabang berhasil diambil' })
  findAllCabang (@Request() req) {
    return this.usersService.findAll(req.user, 'cabang')
  }

  @Get('me')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'Profil diri sendiri' })
  findMe (@Request() req) {
    return this.usersService.findOne(req.user.id, req.user)
  }

  @Get(':id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Detail user by ID' })
  @ApiParam({ name: 'id', type: 'number', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Detail user berhasil diambil' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  findOne (@Param('id') id: number, @Request() req) {
    return this.usersService.findOne(id, req.user)
  }

  @Patch(':id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Update data user' })
  @ApiParam({ name: 'id', type: 'number', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User berhasil diupdate' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  update (@Param('id') id: number, @Body() dto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, dto, req.user)
  }

  @Patch(':id/status')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Suspend atau aktifkan akun user' })
  @ApiParam({ name: 'id', type: 'number', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Status berhasil diubah' })
  @ApiResponse({ status: 400, description: 'Tidak bisa suspend diri sendiri' })
  updateStatus (
    @Param('id') id: number,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.usersService.updateStatus(id, dto, req.user)
  }

  @Patch(':id/password')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset password user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Password berhasil direset' })
  @ApiResponse({
    status: 403,
    description: 'Hanya admin yang bisa reset password',
  })
  updatePassword (
    @Param('id') id: number,
    @Body() dto: UpdatePasswordDto,
    @Request() req,
  ) {
    return this.usersService.updatePassword(id, dto, req.user)
  }

  @Delete(':id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Hapus user' })
  @ApiParam({ name: 'id', type: 'number', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'User berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'User tidak ditemukan' })
  remove (@Param('id') id: number, @Request() req) {
    return this.usersService.remove(id, req.user)
  }
}
