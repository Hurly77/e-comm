import { Transform } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { Category } from 'src/api/category/entities/category.entity';

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

  @Column({ nullable: true })
  purchaseLimit: number;

  @Column('decimal', { precision: 10, scale: 2 })
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  price: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  @Transform(({ value }) => parseFloat(value), { toClassOnly: true })
  regularPrice: number;

  @Column('json', { nullable: true })
  specs: Record<string, string>;

  @Column('json', { nullable: true })
  highlights: string[];

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

  @ManyToOne(() => Category, (category) => category.products)
  category: Category | null;
}
