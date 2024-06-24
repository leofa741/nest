import { ConflictException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductsService {

  private readonly logger = new Logger('ProductsService');

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) { }


  
  async create(createProductDto: CreateProductDto) {
    const queryRunner = this.productRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verifica si el producto ya existe en la base de datos
      const existingProduct = await this.productRepository.findOne({
        where: { title: createProductDto.title },
      });

      // Si el producto ya existe, lanza una excepción
      if (existingProduct) {
        throw new ConflictException(`Product already exists: ${existingProduct.title}`);
      }

      // Genera el slug si no está presente en createProductDto
      if (!createProductDto.slug) {
        createProductDto.slug = this.generateSlug(createProductDto.title);
      }

      // Crear el producto sin las imágenes
      const product = this.productRepository.create({
        ...createProductDto,
        images: [],
      });
      await queryRunner.manager.save(product);

      // Maneja las imágenes
      const images = createProductDto.images || [];
      const productImages = images.map((imageUrl) => {
        return this.imageRepository.create({
          url: imageUrl,
          product: product,
        });
      });

      // Guarda las imágenes
      await queryRunner.manager.save(productImages);

      await queryRunner.commitTransaction();
      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);
      // Si el error es una ConflictException, solo re-lánzalo
      if (error instanceof ConflictException) {
        throw error;
      }
      // Para otros errores, lanza una excepción de servidor interno
      const errorMessage = error.detail || 'An error occurred while creating the product';
      throw new InternalServerErrorException(errorMessage);
    } finally {
      await queryRunner.release();
    }
  }

 

  async findAll(page: number = 1, limit: number = 10): Promise<{ products: Product[], total: number }> {
    try {
      const offset = (page - 1) * limit; // Calcular el offset basado en la página y el límite

      const [products, total] = await this.productRepository.findAndCount({
        skip: offset,
        take: limit,
      });

      return { products, total };
    } catch (error) {
      throw new InternalServerErrorException('Failed to retrieve products');
    }
  }



  async findOne(query: string): Promise<Product> {
    try {
      // Intentar encontrar el producto por ID o por slug
      let product: Product;
      
      if (this.isValidUUID(query)) {
        product = await this.productRepository.findOneBy({ id: query });
      } else {
        product = await this.productRepository.findOneBy({ slug: query });
      }

      if (!product) {
        throw new NotFoundException(`Product with ID or slug ${query} not found`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve product');
    }
  }

  
  async update(productId: string, updateProductDto: UpdateProductDto) {
    const queryRunner = this.productRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verifica si el producto existe en la base de datos
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['images'], // Aquí 'images' se refiere a la propiedad en la entidad Product que tiene la relación con ProductImage
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Actualiza las propiedades del producto
      Object.assign(product, updateProductDto);

      // Genera el slug si es necesario
      if (updateProductDto.title && !updateProductDto.slug) {
        product.slug = this.generateSlug(updateProductDto.title);
      }

      // Manejo de imágenes
      if (updateProductDto.images) {
        // Elimina las imágenes antiguas
        await this.imageRepository.delete({ product: { id: productId } });        

        // Crea nuevas instancias de imágenes y las asocia al producto
        const newImages = updateProductDto.images.map((imageUrl) => {
          const newImage = this.imageRepository.create({
            url: imageUrl,
            product: product, // Asigna el producto a la imagen
          });
          return newImage;
        });

        // Guarda las nuevas imágenes
        const savedImages = await queryRunner.manager.save(newImages);

        // Actualiza las relaciones en el producto
        product.images = savedImages;
      }

      // Guarda el producto actualizado
      await queryRunner.manager.save(Product, product);

      await queryRunner.commitTransaction();
      return product;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);

      // Para otros errores, lanza una excepción de servidor interno
      const errorMessage = error.detail || 'An error occurred while updating the product';
      throw new InternalServerErrorException(errorMessage);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(productId: string): Promise<void> {
    const queryRunner = this.productRepository.manager.connection.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verifica si el producto existe en la base de datos
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['images'], // Aquí 'images' se refiere a la propiedad en la entidad Product que tiene la relación con ProductImage
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      // Elimina las imágenes asociadas al producto
      if (product.images && product.images.length > 0) {
        await queryRunner.manager.remove(ProductImage, product.images);
      }

      // Elimina el producto
      await queryRunner.manager.remove(Product, product);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(error);
      throw new InternalServerErrorException('Failed to delete the product');
    } finally {
      await queryRunner.release();
    }
  }

  // Función para generar el slug a partir del título
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')  // Elimina caracteres no alfanuméricos y guiones
      .replace(/\s+/g, '-')      // Reemplaza espacios por guiones
      .replace(/-+/g, '-');      // Reemplaza múltiples guiones por uno solo
  }

   // Método auxiliar para validar si el query es un UUID
   private isValidUUID(str: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(str);
  }
}
