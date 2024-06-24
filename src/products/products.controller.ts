import { Controller, Get, Post, Body,  Param, Delete,  NotFoundException, Put, ConflictException, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { FindProductDto } from './dto/find-producto.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
    
  }

  @Get()
  async findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
    const result = await this.productsService.findAll(page, limit);
    
    const productFormat =result.products.map(product => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      description: product.description,
      price: product.price,
      images: product.images.map(image => image.url),
      // Otras propiedades del producto según sea necesario
    }))
    return {
      productFormat,
      total: result.total,
      page,
      limit,
    };
  }


  @Get(':query')
  async getProduct(@Param('query') query: string): Promise<Product> {
    return await this.productsService.findOne(query);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
    try {
      const updatedProduct = await this.productsService.update(id, updateProductDto);
      return updatedProduct;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw error; // Lanza cualquier otro tipo de error
    }
  }


  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    try {
      const removedProduct = await this.productsService.delete(id);
      return { message: `Product with id ${id} has been successfully removed` };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error; // Lanza cualquier otro tipo de error
    }
  }




}
