import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductImage {
  constructor(partial: Partial<ProductImage>) {
    Object.assign(this, partial);
  }
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Column()
  s3_key: string;

  @Column()
  s3_location: string;

  @Column({ default: false })
  isThumbnail: boolean;

  @ManyToOne(() => Product, (product) => product.images)
  product: Product;

  @CreateDateColumn()
  created_at: Date;
  @UpdateDateColumn()
  updated_at: Date;
}
