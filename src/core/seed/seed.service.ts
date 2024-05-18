import { Injectable, Logger } from '@nestjs/common';
import { ProductService } from 'src/api/product/product.service';
import { SeedProduct } from './dto/product.dto';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { CreateProductDto } from 'src/api/product/dto/create-product.dto';
import { createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { S3Service } from '../s3/s3.service';
import { AuthService } from 'src/api/auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { AuthRole } from 'src/types/enums';
import { Category } from 'src/api/category/entities/category.entity';
import { CategoryService } from 'src/api/category/category.service';
import { create } from 'domain';

@Injectable()
export class SeedService {
  private readonly logger = new Logger('==*' + SeedService.name + '*==');
  constructor(
    private productService: ProductService,
    private dbService: DatabaseService,
    private s3Service: S3Service,
    private authService: AuthService,
    private categoryService: CategoryService,
    private configService: ConfigService,
  ) {}

  private generateSKU(product: SeedProduct): string {
    // Normalize title to generate a base SKU part from the first two characters of each word
    const titlePart = product.title
      .split(/[^a-zA-Z0-9]/g) // Split on non-alphanumeric characters
      .filter(Boolean) // Remove empty strings
      .slice(0, 3) // Take first three words for better uniqueness
      .map((word) => word.slice(0, 2)) // Take first two characters of each word
      .join('')
      .toUpperCase();

    // Use the last category in the array
    const lastCategory = product.categories[product.categories.length - 1]?.name || '';

    // Normalize category to generate a base SKU part from the first character of each word
    const categoryPart = lastCategory
      .split(/[^a-zA-Z0-9]/g) // Split on non-alphanumeric characters
      .filter(Boolean) // Remove empty strings
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase();

    // Hash UPC for uniqueness and take the first 4 characters
    const hash = createHash('sha256');
    hash.update(product.upc);
    const uniquePart = hash.digest('hex').substring(0, 4).toUpperCase();

    // Combine parts to form the SKU, ensuring length is between 8-12 characters
    const skuBase = `${titlePart}${categoryPart}${uniquePart}`;

    // Adjust SKU length if necessary
    let sku = skuBase.slice(0, 12);
    if (sku.length < 8) {
      sku = sku.padEnd(8, 'X'); // Pad with 'X' to reach minimum length of 8
    }

    return sku;
  }

  private async processBatch(products: SeedProduct[], batchSize: number): Promise<void> {
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (product, idx) => {
          const productImages = await Promise.all(
            product.images
              ?.filter((img) => img !== null)
              .map(async (image) => {
                const response = await fetch(image);
                const blob = await response.blob();
                const arrBuffer = await blob.arrayBuffer();
                const imgName = `${randomUUID()}.jpg`;
                const imgFile: Express.Multer.File = {
                  fieldname: `file_${idx}`,
                  filename: imgName,
                  encoding: '7bit',
                  originalname: imgName,
                  mimetype: response.headers['content-type'],
                  buffer: Buffer.from(arrBuffer),
                  size: blob.size,
                  stream: null,
                  destination: '',
                  path: '',
                };
                return imgFile;
              }),
          );

          const seedProductCategory = product.categories[product.categories.length - 1];
          const category = await this.categoryService.findByWebId(seedProductCategory.id);

          const createProduct: CreateProductDto = {
            title: product.title,
            description: '',
            price: product.price ?? Math.floor(Math.random() * 1000) + 0.99,
            SKU: this.generateSKU(product),
            stock: Math.floor(Math.random() * 100),
          };
          try {
            return await this.productService.create(createProduct, category, productImages);
          } catch (err) {
            this.logger.error(`${err.message}: ${createProduct.SKU}`);
          }
        }),
      );
      this.logger.log(`Processed batch ${i + 1} of ${products.length}`);
    }
  }

  private async seedProducts() {
    const seedProductsResponse = await fetch(this.configService.get('PRODUCT_SEED_PRODUCT_URL'));
    const seedProducts = (await seedProductsResponse.json()) as SeedProduct[];

    const batchSize = 10; // Adjust the batch size as needed

    await this.processBatch(seedProducts, batchSize);

    const newProducts = await this.productService.findAll(); // Assuming you have a method to get all products
    const skus = new Set(newProducts.map((product) => product.SKU));
    console.log('Unique SKUs', skus.size, 'of', newProducts.length);
  }

  async seedCategories(): Promise<void> {
    const url = this.configService.get('PRODUCT_SEED_PRODUCT_URL') + '?clean=true&fields=categories';
    const response = await fetch(url);
    const data: { categories: SeedCategory[] }[] = await response.json();

    const categoryMap = new Map<string, Category>();

    for (const item of data) {
      for (const category of item.categories) {
        await this.processCategory(category, categoryMap);
      }
    }
  }

  private async processCategory(
    category: SeedCategory,
    categoryMap: Map<string, Category>,
    parent: Category = null,
  ): Promise<Category> {
    if (categoryMap.has(category.id)) {
      return categoryMap.get(category.id);
    }

    let parentCategory: Category = null;
    if (category.parent) {
      parentCategory = await this.processCategory(category.parent, categoryMap);
    }

    let existingCategory = await this.categoryService.findCategoryByName(category.name);
    if (!existingCategory) {
      existingCategory = await this.categoryService.createCategory({
        name: category.name,
        parent: parentCategory,
        web_id: category.id,
      });
    }

    categoryMap.set(category.id, existingCategory);

    return existingCategory;
  }

  private async seedAdmins() {
    await this.authService.registerAdmin({
      email: this.configService.get('ADMIN_EMAIL'),
      password: this.configService.get('ADMIN_PASSWORD'),
      first_name: this.configService.get('ADMIN_FIRST_NAME'),
      last_name: this.configService.get('ADMIN_LAST_NAME'),
      role: AuthRole.ADMIN,
    });
  }

  public async seed() {
    const doSeed = this.configService.get('SEED') === 'true';
    this.logger.log(`Seeding: ${doSeed}`);
    if (doSeed) {
      await this.s3Service.emptyBucket(process.env.AWS_S3_BUCKET_NAME);
      await this.dbService.resetDatabase();
      await this.seedAdmins();
      await this.seedCategories();
      await this.seedProducts();
      this.logger.log('-- SEEDING COMPLETE --');
    }
  }

  public async reset() {
    await this.s3Service.emptyBucket(process.env.AWS_S3_BUCKET_NAME);
    await this.dbService.resetDatabase();
    this.logger.log('-- RESET COMPLETE --');
  }
}
