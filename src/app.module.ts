import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module'
import { CloudinaryModule } from './cloudinary/cloudinary.module'
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { RestaurantModule } from './restaurants/restaurants.module'
import { MenuModule } from './menu/menu.module'
import { TableModule } from './tables/table.module'

@Module({
  imports: [UserModule, AuthModule, PrismaModule, CloudinaryModule, RestaurantModule, MenuModule, TableModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
