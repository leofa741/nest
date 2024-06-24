import { text } from "stream/consumers";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export class ProductImage {


    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column('text')
    url: string;

    @ManyToOne(
        () =>Product,
(product) => product.images,
    )
    @JoinColumn({ name: 'product_id' })
    product:Product

    createdAt: Date;

    updatedAt: Date;

}
