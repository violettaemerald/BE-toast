import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@ApiTags('Auth')
@ApiBearerAuth('bearer-token')

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login dan dapatkan JWT token' })
  @ApiResponse({ status: 200, description: 'Login berhasil' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Ambil data user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Data user berhasil diambil' })
  @ApiResponse({ status: 401, description: 'Token tidak valid' })
  me(@Request() req) {
    return this.authService.me(req.user.id);
  }
}