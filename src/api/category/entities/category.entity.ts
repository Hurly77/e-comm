import { Product } from 'src/api/product/entities/product.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn, Tree, TreeChildren, TreeParent } from 'typeorm';

@Entity()
@Tree('closure-table')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  web_id: string;

  @Column()
  name: string;

  @Column({ nullable: true, default: null })
  imgURL: string | null;

  @Column({ nullable: true, default: null })
  s3_key: string | null;

  @TreeChildren()
  children: Category[];

  @TreeParent()
  parent: Category;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
