import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  TradeMissionEvent,
  TradeMissionEventSchema,
} from './schemas/trade-mission-event.schema';
import {
  TradeMissionApplication,
  TradeMissionApplicationSchema,
} from './schemas/trade-mission-application.schema';
import { TradeMissionApplicationsService } from './trade-mission-applications.service';
import { TradeMissionApplicationsController } from './trade-mission-applications.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TradeMissionEvent.name, schema: TradeMissionEventSchema },
      {
        name: TradeMissionApplication.name,
        schema: TradeMissionApplicationSchema,
      },
    ]),
  ],
  controllers: [TradeMissionApplicationsController],
  providers: [TradeMissionApplicationsService],
  exports: [TradeMissionApplicationsService],
})
export class TradeMissionApplicationsModule {}
