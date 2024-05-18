import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(@InjectRepository(Category, 'ecommerce-db') private categoryRepo: Repository<Category>) {}
  create(createCategoryDto: CreateCategoryDto) {
    return 'This action adds a new category';
  }

  async createCategory(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const { name, parent, web_id } = createCategoryDto;
    const newCategory = new Category();
    newCategory.name = name;
    newCategory.parent = parent;
    newCategory.web_id = web_id;
    return this.categoryRepo.save(newCategory);
  }

  async findCategoryByName(name: string): Promise<Category> {
    return this.categoryRepo.findOne({ where: { name } });
  }

  async findCategoryById(id: number): Promise<Category> {
    return this.categoryRepo.findOne({
      where: { id },
    });
  }

  async findCategoryAndChildrenById(id: number): Promise<Category> {
    return this.categoryRepo.findOne({
      where: { id },
      relations: ['children'],
    });
  }

  async findByWebId(web_id: string) {
    const category = await this.categoryRepo.findOne({ where: { web_id } });
    return category;
  }

  findAll() {
    return this.categoryRepo.find({
      where: { parent: IsNull() },
      relations: ['children', 'parent'],
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
}
