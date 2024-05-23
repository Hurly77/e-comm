import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Query,
  ValidationPipe,
} from '@nestjs/common';
// Remove the unused import statement for ProductService
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
import { AuthRole } from 'src/types/enums';
import { Roles } from 'src/decorators/Role';
import { RolesGuard } from 'src/guards/admin-guard';
import { Public } from 'src/decorators/Public';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CheckFilters } from './dto/product-filters.dto';

@Controller('product')
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @Roles(AuthRole.ADMIN)
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('images'))
  create(@UploadedFiles() files: Array<Express.Multer.File>, @Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto, null, files);
  }

  @Get()
  @Public()
  findAll(@Query(new ValidationPipe({ transform: true })) filters: CheckFilters) {
    return this.productService.findAll(filters);
  }

  @Get('category-ids')
  @Public()
  findAllCategoryIds(@Query(new ValidationPipe({ transform: true })) filters: CheckFilters) {
    const products = this.productService.findCategoryImages(filters.ids);
    return { filters, products };
  }

  @Get('category/:id')
  @Public()
  findAllByCategory(@Param('id') id: string) {
    return this.productService.findAllByCategory(+id);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  @Roles(AuthRole.ADMIN)
  @UseGuards(RolesGuard)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Delete(':id')
  @Roles(AuthRole.ADMIN)
  @UseGuards(RolesGuard)
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }
}
