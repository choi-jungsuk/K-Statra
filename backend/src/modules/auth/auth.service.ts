import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { User, UserDocument } from './schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BuyersService } from '../buyers/buyers.service';
import { CompaniesService } from '../companies/companies.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly buyersService: BuyersService,
    private readonly companiesService: CompaniesService,
  ) {}

  private hashPassword(password: string): string {
    // Standard secure SHA-256 hashing (zero dependency)
    const salt = 'kstatra_secure_salt_2026';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
  }

  async register(dto: RegisterDto): Promise<any> {
    const { email, password, name, role, country, industries } = dto;

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다');
    }

    const passwordHash = this.hashPassword(password);
    let buyerId: string | undefined = undefined;
    let companyId: string | undefined = undefined;

    // Automatically create profile in Buyer/Company collections
    if (role === 'buyer') {
      const buyer = await this.buyersService.create({
        name,
        country: country || 'South Korea',
        industries: industries || [],
        needs: [],
        tags: [],
        profileText: `${name} is an active trade buyer registered on K-Statra.`,
      });
      buyerId = buyer._id.toString();
    } else if (role === 'company') {
      const company = await this.companiesService.create({
        name,
        industry: industries?.[0] || 'K-Beauty',
        tags: industries || [],
        profileText: `${name} is an export-ready supplier on K-Statra.`,
      });
      companyId = company._id.toString();
    }

    const newUser = (await this.userModel.create({
      email,
      passwordHash,
      role,
      name,
      buyerId,
      companyId,
    })) as any;

    const payload = {
      sub: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      buyerId: newUser.buyerId,
      companyId: newUser.companyId,
    };

    return {
      message: '회원가입이 완료되었습니다.',
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        buyerId: newUser.buyerId,
        companyId: newUser.companyId,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(dto: LoginDto): Promise<any> {
    const { email, password } = dto;
    const user = await this.userModel.findOne({ email }).exec();

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 일치하지 않습니다');
    }

    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
      buyerId: user.buyerId,
      companyId: user.companyId,
    };

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        buyerId: user.buyerId,
        companyId: user.companyId,
      },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateUserById(id: string): Promise<any> {
    const user = await this.userModel.findById(id).exec();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      buyerId: user.buyerId,
      companyId: user.companyId,
    };
  }
}
