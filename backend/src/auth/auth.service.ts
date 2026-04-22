import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string, tenantSlug: string) {
    const user = await this.usersService.findByEmailAndTenant(email, tenantSlug);
    if (!user || !user.isActive) return null;

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return null;

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const user = await this.validateUser(
      loginDto.email,
      loginDto.password,
      loginDto.tenantSlug,
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Audit log
    await this.auditService.log({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'LOGIN',
      resource: 'auth',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 12);
    return this.usersService.createWithTenant({
      ...registerDto,
      passwordHash,
    });
  }

  async logout(userId: string, tenantId: string, ipAddress?: string) {
    await this.auditService.log({
      tenantId,
      userId,
      action: 'LOGOUT',
      resource: 'auth',
      ipAddress,
    });
    return { message: 'Logged out successfully' };
  }
}
