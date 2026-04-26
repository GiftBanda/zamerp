import {
  Controller, Post, Body, Get, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email, password and tenant slug' })
  @ApiResponse({ status: 200, description: 'Returns JWT token and user info' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    return this.authService.login(
      loginDto,
      req.ip,
      req.headers['user-agent'],
    );
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new tenant and admin user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: any, @Req() req: any) {
    return this.authService.logout(user.id, user.tenantId, req.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return user;
  }
}
