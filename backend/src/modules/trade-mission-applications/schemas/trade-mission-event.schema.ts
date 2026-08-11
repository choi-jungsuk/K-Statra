import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TradeMissionEventDocument = TradeMissionEvent & Document;

@Schema({ timestamps: true, collection: 'trade_mission_events' })
export class TradeMissionEvent {
  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  nameKo: string;

  @Prop()
  nameEn: string;

  @Prop({ default: 'trade_mission' })
  type: string;

  @Prop()
  descriptionKo: string;

  @Prop()
  descriptionEn: string;

  @Prop({ required: true })
  targetCountry: string;

  @Prop()
  targetRegion: string;

  @Prop()
  targetCity: string;

  @Prop()
  startDate: string;

  @Prop()
  endDate: string;

  @Prop()
  applicationOpenAt: string;

  @Prop({ required: true })
  applicationDeadline: string;

  @Prop({ type: [String], default: [] })
  targetIndustries: string[];

  @Prop({ default: 30 })
  capacity: number;

  @Prop()
  contactName: string;

  @Prop()
  contactEmail: string;

  @Prop({ default: 'open', enum: ['draft', 'open', 'closed', 'archived'] })
  status: string;

  @Prop({ default: 'v1.0' })
  privacyNoticeVersion: string;

  @Prop()
  createdBy: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TradeMissionEventSchema = SchemaFactory.createForClass(TradeMissionEvent);
