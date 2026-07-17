import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { loginSchema, LoginDto } from './dto/login.schema';

const REFRESH_COOKIE = 'refresh_token';

/**
 * En production, le frontend (ex: Vercel) et le backend (ex: Railway) sont
 * sur des domaines différents : le cookie doit donc être SameSite=None
 * (+ Secure, obligatoire avec None) pour être envoyé sur les requêtes
 * cross-site. En local, les deux tournent sur des ports différents du même
 * domaine (localhost) : SameSite=Lax suffit et évite d'exiger HTTPS en dev.
 */
function refreshCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(dto.email, dto.password);

    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    return { accessToken, user };
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (refreshToken) await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions());
    return { success: true };
  }
}
