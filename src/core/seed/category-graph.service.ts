import { SeedCategory } from './dto/category.dto';

export interface CategoryNode {
  id: string;
  name: string;
  children: CategoryNode[];
  parent: CategoryNode | null;
}

export class CategoryGraph extends Map<string, CategoryNode> {
  constructor(categories: SeedCategory[]) {
    super();
    this.buildCategoryGraph(categories);
  }

  private addCategoryToMap(category: SeedCategory) {
    if (!this.has(category.id)) {
      this.set(category.id, {
        id: category.id,
        name: category.name,
        children: [],
        parent: null,
      });
    }
  }

  private buildCategoryGraph(categories: SeedCategory[]) {
    categories.forEach((category) => {
      let currentCategory: SeedCategory | undefined = category;
      while (currentCategory) {
        this.addCategoryToMap(currentCategory);

        if (currentCategory.parent) {
          const parentCategory = currentCategory.parent;
          this.addCategoryToMap(parentCategory);

          const parentNode = this.get(parentCategory.id)!;
          const currentNode = this.get(currentCategory.id)!;

          if (!parentNode.children.includes(currentNode)) {
            parentNode.children.push(currentNode);
          }

          currentNode.parent = parentNode;
        }

        currentCategory = currentCategory.parent;
      }
    });
  }

  getRootCategories(): CategoryNode[] {
    return Array.from(this.values()).filter((category) => !category.parent);
  }

  getCategoryById(id: string): CategoryNode | undefined {
    return this.get(id);
  }
}
