import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TradeMissionApplicationDocument = TradeMissionApplication & Document;

@Schema({ timestamps: true, collection: 'trade_mission_applications' })
export class TradeMissionApplication {
  @Prop({ required: true, unique: true, index: true })
  applicationNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'TradeMissionEvent', required: true, index: true })
  eventId: Types.ObjectId;

  @Prop({ required: true, index: true })
  eventSlug: string;

  @Prop({ required: true, index: true })
  companyNameKo: string;

  @Prop()
  companyNameEn: string;

  @Prop()
  businessRegistrationNo: string;

  @Prop()
  website: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  industry: string;

  @Prop({ required: true })
  products: string;

  @Prop({ required: true })
  contactName: string;

  @Prop()
  contactDepartment: string;

  @Prop({ required: true, index: true })
  contactEmail: string;

  @Prop({ required: true })
  contactPhone: string;

  @Prop()
  targetCountry: string;

  @Prop({ required: true })
  participationProducts: string;

  @Prop({ default: 'none', enum: ['none', 'preparing', 'experienced'] })
  exportExperienceLevel: string;

  @Prop({ type: [String], default: [] })
  existingExportCountries: string[];

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  desiredBuyerTypes: string[];

  @Prop()
  participationPurpose: string;

  @Prop({ required: true, default: true })
  privacyConsent: boolean;

  @Prop({ default: 'v1.0' })
  privacyNoticeVersion: string;

  @Prop({ default: Date.now })
  consentedAt: Date;

  @Prop({ default: false })
  marketingConsent: boolean;

  @Prop({
    default: 'submitted',
    enum: [
      'submitted',
      'reviewing',
      'needs_information',
      'approved',
      'waitlisted',
      'rejected',
      'withdrawn',
    ],
  })
  status: string;

  @Prop({ default: '' })
  adminNote: string;

  @Prop()
  reviewedBy: string;

  @Prop()
  reviewedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TradeMissionApplicationSchema = SchemaFactory.createForClass(TradeMissionApplication);
