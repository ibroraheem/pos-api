import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
    constructor(private auditService: AuditService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, user, ip, originalUrl, body } = request;

        // Only log write operations usually, or critical reads
        if (!['POST', 'PATCH', 'DELETE'].includes(method)) {
            return next.handle();
        }

        return next.handle().pipe(
            tap(async () => {
                if (user && user.tenantId && user.userId) {
                    const action = `${method}_${originalUrl.split('/')[1]?.toUpperCase()}`; // e.g., POST_SALES
                    await this.auditService.logAction(
                        user.userId,
                        user.tenantId,
                        action,
                        { body, url: originalUrl },
                        ip
                    );
                }
            }),
        );
    }
}
