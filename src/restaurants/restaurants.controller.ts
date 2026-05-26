import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger'
import { RestaurantService } from './restaurants.service'
import { UpdateRestaurantDto } from './dto/update-restaurant.dto'
import { UpdateBranchDto } from './dto/update-branch.dto'
import { UpdateStatusDto } from './dto/update-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorators'
import { UploadedFile, UseInterceptors } from '@nestjs/common'
import { memoryStorage } from 'multer'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { ApiConsumes } from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Restaurants & Branches')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class RestaurantController {
  constructor (private restaurantService: RestaurantService, private cloudinaryService: CloudinaryService) {}

  @Get('restaurants')
  @Roles('admin')
  @ApiOperation({ summary: 'List semua restaurant' })
  findAllRestaurants () {
    return this.restaurantService.findAllRestaurants()
  }

  @Get('restaurants/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Detail restaurant by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  findOneRestaurant (@Param('id') id: string, @Request() req) {
    return this.restaurantService.findOneRestaurant(+id, req.user)
  }

  @Patch('restaurants/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Update data restaurant' })
  @ApiParam({ name: 'id', type: 'number' })
  updateRestaurant (
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @Request() req,
  ) {
    return this.restaurantService.updateRestaurant(+id, dto, req.user)
  }

  @Patch('restaurants/:id/logo')
  @Roles('admin', 'resto')
  @ApiOperation({summary: 'Upload logo restaurant'})
  @ApiConsumes('multipart/form-data')
  @ApiParam({name: 'id', type: 'number'})
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        cb(null, allowed.includes(file.mimetype))
    },
  }))
  async uploadLogo (
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {

    if (!file) {
        throw new BadRequestException('File tidak ditemukan!')
    }
    const url = await this.cloudinaryService.upload(file, 'restaurants')
    return this.restaurantService.updateRestaurant(+id, { logoUrl: url }, req.user)
  }

  @Patch('restaurants/:id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Suspend atau aktifkan restaurant' })
  @ApiParam({ name: 'id', type: 'number' })
  updateRestaurantStatus (
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.restaurantService.updateRestaurantStatus(+id, dto, req.user)
  }

  @Delete('restaurants/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Hapus restaurant' })
  @ApiParam({ name: 'id', type: 'number' })
  removeRestaurant (@Param('id') id: string, @Request() req) {
    return this.restaurantService.removeRestaurant(+id, req.user)
  }

  @Get('branches')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'List branch (admin: semua, resto: miliknya)' })
  findAllBranches (@Request() req) {
    return this.restaurantService.findAllBranches(req.user)
  }

  @Get('branches/:id')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'Detail branch by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  findOneBranch (@Param('id') id: string, @Request() req) {
    return this.restaurantService.findOneBranch(+id, req.user)
  }

  @Patch('branches/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Update data branch' })
  @ApiParam({ name: 'id', type: 'number' })
  updateBranch (
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
    @Request() req,
  ) {
    return this.restaurantService.updateBranch(+id, dto, req.user)
  }

  @Patch('branches/:id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Suspend atau aktifkan branch' })
  @ApiParam({ name: 'id', type: 'number' })
  updateBranchStatus (
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.restaurantService.updateBranchStatus(+id, dto, req.user)
  }

  @Delete('branches/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Hapus branch' })
  @ApiParam({ name: 'id', type: 'number' })
  removeBranch (@Param('id') id: string, @Request() req) {
    return this.restaurantService.removeBranch(+id, req.user)
  }
}
