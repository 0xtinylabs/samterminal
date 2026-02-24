import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { RepositoryModule } from './repositories/repository.module';

@Global()
@Module({
  providers: [DatabaseService],
  imports: [RepositoryModule],
  exports: [DatabaseService, RepositoryModule],
})
export class DatabaseModule {}
