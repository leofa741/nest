// src/products/dto/find-product.dto.ts

import { IsUUID } from 'class-validator';

export class FindProductDto {
  @IsUUID('4', { message: 'Invalid UUID format' })
  id: string;
}
