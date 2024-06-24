import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');// 



    // Configuración de Swagger
  const config = new DocumentBuilder()
  .setTitle('API Example')
  .setDescription('API description')
  .setVersion('1.0')
  .addTag('example')
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);

app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true
  })
 );

  await app.listen(3000);
}
bootstrap();
