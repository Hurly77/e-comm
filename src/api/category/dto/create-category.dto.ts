import { Category } from '../entities/category.entity';

export class CreateCategoryDto {
  name: string;
  web_id: string;
  parent: Category | null;
}
