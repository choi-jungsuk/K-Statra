import { Module } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { MarketResearchService } from './market-research.service';
import { RegionalConsultantService } from './regional-consultant.service';
import { PartnersModule } from '../partners/partners.module';

@Module({
  imports: [PartnersModule],
  controllers: [AgentController],
  providers: [AgentService, MarketResearchService, RegionalConsultantService],
})
export class AgentModule {}
