import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ApplicationDocument = Application & Document;

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

@Schema({ timestamps: true, collection: 'applications' })
export class Application {
  @Prop({ required: true })
  event_id: string; // URL slug, e.g. 'koaa-booth-2026'

  @Prop({ required: true })
  event_name: string; // 사람이 읽는 이름, e.g. 'KOAA SHOW 2026 - 부스 참가'

  @Prop({ required: true })
  event_type: string; // 'booth' | 'market_pioneer'

  @Prop({ required: true })
  company_name: string;

  @Prop({ required: true })
  contact_person: string;

  @Prop({ required: true })
  contact_email: string;

  @Prop({ required: true })
  contact_phone: string;

  @Prop()
  business_reg_no: string;

  @Prop()
  website: string;

  @Prop({ required: true })
  industry: string;

  @Prop()
  products: string;

  @Prop()
  booth_size: string; // 예: '3x3', '6x3', '미정'

  @Prop()
  target_country: string; // 시장개척단용

  @Prop()
  reason: string;

  @Prop()
  memo: string;

  @Prop({ default: 'pending' })
  status: ApplicationStatus;

  @Prop()
  admin_note: string;

  @Prop()
  reviewed_at: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
