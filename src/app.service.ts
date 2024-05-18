import { Injectable, Logger } from '@nestjs/common';
import { SeedService } from './core/seed/seed.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(public seedService: SeedService) {}
  onApplicationBootstrap() {
    this.logger.log('Seeding database...');
    this.seedService.seed();
    // this.seedService.reset();
  }
}
