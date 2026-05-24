import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, default: 'buyer' })
  role: 'buyer' | 'company' | 'admin';

  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  buyerId: string;

  @Prop({ type: String, default: null })
  companyId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
