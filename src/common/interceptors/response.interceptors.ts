import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const res = context.switchToHttp().getResponse();

        return next.handle().pipe(
            map(data => ({
                statusCode: res.statusCode,
                success: true,
                message: data?.message ?? 'OK',
                data: data,
            }))
        )
    }
}