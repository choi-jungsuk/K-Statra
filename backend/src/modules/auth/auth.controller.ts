import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(dto);
    
    // Set secure cookie
    res.cookie('kstatra_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Automatically secure on HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user & issue JWT' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);
    
    // Set secure cookie
    res.cookie('kstatra_token', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Automatically secure on HTTPS in production
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out and clear session cookie' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('kstatra_token', { path: '/' });
    return { message: '로그아웃 되었습니다.' };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return req.user;
  }
}
