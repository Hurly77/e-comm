import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseService {
  constructor(@InjectDataSource('ecommerce-db') private readonly dataSource: DataSource) {}

  async resetDatabase(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      // Dropping the schema
      await queryRunner.clearDatabase();
      // Recreating the schema
      await this.dataSource.synchronize();
    } finally {
      await queryRunner.release();
    }
  }
}
