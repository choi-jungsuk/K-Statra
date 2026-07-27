import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminTokenGuard } from './guards/admin-token.guard';
import { AuditLog, AuditLogSchema } from './schemas/audit-log.schema';
import { CompaniesModule } from '../companies/companies.module';
import { BuyersModule } from '../buyers/buyers.module';
import { PaymentsModule } from '../payments/payments.module';
import { MatchLog, MatchLogSchema } from '../matches/schemas/match-log.schema';
import { ExhibitorUploadController } from './exhibitor-upload.controller';
import { ExhibitorUploadService } from './exhibitor-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: MatchLog.name, schema: MatchLogSchema },
    ]),
    CompaniesModule,
    BuyersModule,
    PaymentsModule,
  ],
  controllers: [AdminController, ExhibitorUploadController],
  providers: [AdminService, AdminTokenGuard, ExhibitorUploadService],
  exports: [AdminService],
})
export class AdminModule {}
