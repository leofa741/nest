import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { FilesModule } from './files/files.module';
@Module({
 imports: [
  ConfigModule.forRoot(),

  TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    autoLoadEntities:true,
    synchronize: true, // No uses esto en producción, puede causar pérdida de datos
  }),

  ProductsModule,

  CommonModule,

  FilesModule,
], 

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
