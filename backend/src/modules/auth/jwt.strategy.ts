import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

const cookieOrHeaderExtractor = (req: any) => {
  let token: string | null = null;
  
  // 1. Extract from secure HttpOnly cookie
  if (req && req.headers && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((res: any, c: string) => {
      const [key, val] = c.trim().split('=');
      if (key && val) {
        res[key] = decodeURIComponent(val);
      }
      return res;
    }, {} as Record<string, string>);
    token = cookies['kstatra_token'];
  }
  
  // 2. Fallback to Bearer token in headers
  if (!token) {
    token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  }
  
  return token;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: cookieOrHeaderExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'kstatra_jwt_secret_key_2026',
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateUserById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('유효하지 않은 인증 정보입니다');
    }
    return user;
  }
}
