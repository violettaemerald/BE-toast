import { Module } from '@nestjs/common'
import { MenuController } from './menus.controller'
import { MenuService } from './menus.service'

@Module({
  controllers: [MenuController],
  providers:   [MenuService],
})
export class MenuModule {}