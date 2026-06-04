import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { MenuService } from './menus.service'
import { CreateMenuDto } from './dto/create-menu.dto'
import { UpdateMenuDto } from './dto/update-menu.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { UpdateMenuStatusDto } from './dto/update-menu-status.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorators'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { BADQUERY } from 'dns';

@ApiTags('Menus & Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class MenuController {
  constructor (
    private menusService: MenuService,
    private cloudinaryService: CloudinaryService,
  ) {}

  @Get('categories')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'List semua kategori' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  findAllCategories (@Request() req) {
    return this.menusService.findAllCategories()
  }

  // @Post('categories')
  // @Roles('resto')
  // @ApiOperation({ summary: 'Buat kategori baru' })
  // createCategory (@Body() dto: CreateCategoryDto, @Request() req) {
  //   return this.menusService.createCategory(dto, req.user)
  // }

  // @Patch('categories/:id')
  // @Roles('admin', 'resto')
  // @ApiOperation({ summary: 'Update kategori' })
  // @ApiParam({ name: 'id', type: 'number' })
  // updateCategory (
  //   @Param('id') id: string,
  //   @Body() dto: UpdateCategoryDto,
  //   @Request() req,
  // ) {
  //   return this.menusService.updateCategory(+id, dto, req.user)
  // }

  // @Delete('categories/:id')
  // @Roles('admin', 'resto')
  // @ApiOperation({ summary: 'Hapus kategori' })
  // @ApiParam({ name: 'id', type: 'number' })
  // removeCategory (@Param('id') id: string, @Request() req) {
  //   return this.menusService.removeCategory(+id, req.user)
  // }

  @Get('menus')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'List semua menu' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  findAllMenus (@Request() req, @Query('categoryId') categoryId?: string, @Query('keyword') keyword?: string,) {
    return this.menusService.findAllMenus(
      req.user,
      categoryId ? +categoryId : undefined,
      keyword,
    )
  }

  @Get('menus/:id')
  @Roles('admin', 'resto', 'cabang')
  @ApiOperation({ summary: 'Detail menu by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  findOneMenu (@Param('id') id: string, @Request() req) {
    return this.menusService.findOneMenu(+id, req.user)
  }

  @Post('menus')
  @Roles('resto')
  @ApiOperation({
    summary:
      'Buat menu baru + wajib foto (status: pending, nunggu approve admin)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'price', 'image'],
      properties: {
        name: { type: 'string', example: 'Mie Goreng' },
        description: { type: 'string', example: 'Mie goreng spesial' },
        price: { type: 'number', example: 15000 },
        extraFee: { type: 'number', example: 500 },
        extraFeeLabel: { type: 'string', example: 'Biaya kemasan' },
        categoryId: { type: 'number', example: 1 },
        image: { type: 'string', format: 'binary' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp']
        cb(null, allowed.includes(file.mimetype))
      },
    }),
  )
  async createMenu(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateMenuDto,
    @Request() req,
  ) {
    if (!file) throw new BadRequestException('Foto menu wajib diupload!')
    const imageUrl = await this.cloudinaryService.upload(file, 'menus')
    return this.menusService.createMenu(dto, req.user, imageUrl)
  }

  @Patch('menus/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Update menu (foto opsional)' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      name:          { type: 'string' },
      description:   { type: 'string' },
      price:         { type: 'number' },
      extraFee:      { type: 'number' },
      extraFeeLabel: { type: 'string' },
      categoryId:    { type: 'number' },
      image:         { type: 'string', format: 'binary' }, 
    },
  },
})
@ApiParam({ name: 'id', type: 'number' })
@UseInterceptors(FileInterceptor('image', {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
}))
async updateMenu(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
  @Body() dto: UpdateMenuDto,
  @Request() req,
) {
  let imageUrl: string | undefined = undefined

  if (file) {
    imageUrl = await this.cloudinaryService.upload(file, 'menus')
  }

  return this.menusService.updateMenu(+id, dto, req.user, imageUrl)
}

  @Patch('menus/:id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve atau reject menu (admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  updateMenuStatus (
    @Param('id') id: string,
    @Body() dto: UpdateMenuStatusDto,
    @Request() req,
  ) {
    return this.menusService.updateMenuStatus(
      +id,
      dto.status as 'active' | 'rejected',
      req.user,
    )
  }

  @Patch('menus/:id/availability')
  @Roles('cabang')
  @ApiOperation({ summary: 'Toggle ketersediaan menu (cabang only)' })
  @ApiParam({ name: 'id', type: 'number' })
  toggleAvailability (@Param('id') id: string, @Request() req) {
    return this.menusService.toggleAvailability(+id, req.user)
  }

  // @Patch('menus/:id/image')
  // @Roles('resto')
  // @ApiOperation({ summary: 'Upload foto menu' })
  // @ApiConsumes('multipart/form-data')
  // @ApiParam({ name: 'id', type: 'number' })
  // @UseInterceptors(
  //   FileInterceptor('image', {
  //     storage: memoryStorage(),
  //     limits: { fileSize: 5 * 1024 * 1024 },
  //     fileFilter: (req, file, cb) => {
  //       const allowed = ['image/jpeg', 'image/png', 'image/webp']
  //       cb(null, allowed.includes(file.mimetype))
  //     },
  //   }),
  // )
  // async uploadMenuImage (
  //   @Param('id') id: string,
  //   @UploadedFile() file: Express.Multer.File,
  //   @Request() req,
  // ) {
  //   if (!file) throw new BadRequestException('File tidak ditemukan!')
  //   const url = await this.cloudinaryService.upload(file, 'menus')
  //   return this.menusService.updateMenuImage(+id, url, req.user)
  // }

  @Delete('menus/:id')
  @Roles('admin', 'resto')
  @ApiOperation({ summary: 'Hapus menu' })
  @ApiParam({ name: 'id', type: 'number' })
  removeMenu (@Param('id') id: string, @Request() req) {
    return this.menusService.removeMenu(+id, req.user)
  }
}
