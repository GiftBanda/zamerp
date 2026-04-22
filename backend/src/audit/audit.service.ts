import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_TOKEN } from '../database/database.module';
import * as schema from '../database/schema';

interface AuditLogInput {
  tenantId: string;
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'VIEW';
  resource: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(
    @Inject(DATABASE_TOKEN) private db: NodePgDatabase<typeof schema>,
  ) {}

  async log(input: AuditLogInput): Promise<void> {
    try {
      await this.db.insert(schema.auditLogs).values({
        tenantId: input.tenantId,
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        oldValues: input.oldValues,
        newValues: input.newValues,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      });
    } catch (err) {
      // Audit log failure should never break the main operation
      console.error('Audit log error:', err);
    }
  }

  async findAll(tenantId: string, filters?: {
    resource?: string;
    userId?: string;
    action?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const { eq, and, gte, lte, desc } = await import('drizzle-orm');
    const conditions = [eq(schema.auditLogs.tenantId, tenantId)];

    if (filters?.resource) conditions.push(eq(schema.auditLogs.resource, filters.resource));
    if (filters?.userId) conditions.push(eq(schema.auditLogs.userId, filters.userId));
    if (filters?.from) conditions.push(gte(schema.auditLogs.createdAt, filters.from));
    if (filters?.to) conditions.push(lte(schema.auditLogs.createdAt, filters.to));

    const logs = await this.db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        resource: schema.auditLogs.resource,
        resourceId: schema.auditLogs.resourceId,
        oldValues: schema.auditLogs.oldValues,
        newValues: schema.auditLogs.newValues,
        ipAddress: schema.auditLogs.ipAddress,
        metadata: schema.auditLogs.metadata,
        createdAt: schema.auditLogs.createdAt,
        user: {
          id: schema.users.id,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
        },
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
      .where(and(...conditions))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(filters?.limit || 50)
      .offset(filters?.offset || 0);

    return logs;
  }
}
