import { Type } from "class-transformer";
import { ArrayMaxSize, ArrayMinSize, IsArray, IsDecimal, IsNumber, IsOptional, IsPositive, IsString, MinLength } from "class-validator";

export class CreateProductDto {


    @IsString()
    @MinLength(1)
    title: string;

  
    @IsPositive()
    @IsOptional()
    price?: number;

    @IsString()
    @MinLength(1)
    description: string;

    @IsString()
    @MinLength(1)
    @IsOptional()
    slug?: string;

    @IsNumber()
    @IsPositive()
    inStock: number;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(10)
    @IsString({ each: true })
    sizes: string[];

    @IsString()
    @MinLength(1)
    gender: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    tags?: string[];

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    images?: string[];


}
