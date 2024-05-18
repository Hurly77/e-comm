import { Product } from 'src/api/product/entities/product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, TreeChildren, TreeParent } from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  web_id: string;

  @Column()
  name: string;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
