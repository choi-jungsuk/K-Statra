import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { RegionalConsultantService } from './regional-consultant.service';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [PartnersModule],
  controllers: [AgentController],
  providers: [AgentService, RegionalConsultantService],
  exports: [AgentService, RegionalConsultantService],
})
export class AgentModule {}
