import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe ({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.setGlobalPrefix('toast');

  const config = new DocumentBuilder()
  .setTitle('Toast Order System')
  .setDescription('Toast Order System API documentation & endopints.')
  .setVersion('1.0')
  .addBearerAuth(
    { type: 'http', scheme: 'bearer', bearerFormat: 'JWT'}, 'access-token',
  )
  .build();

  const document = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('docs', app, document, { swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log('API running at http://localhost:3000/toast');
  console.log('Swagger docs at http://localhost:3000/docs');
}
bootstrap();
