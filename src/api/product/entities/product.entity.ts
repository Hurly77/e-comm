import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('character varying', { length: 12, unique: true })
  SKU: string;

  @Column()
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  price: number;

  @Column()
  stock: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => ProductImage, (productImage) => productImage.product, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  images: ProductImage[];

  @OneToOne(() => ProductImage, { cascade: true, onDelete: 'CASCADE' }) // Assuming each product has one thumbnail
  @JoinColumn()
  thumbnail: ProductImage;
}
