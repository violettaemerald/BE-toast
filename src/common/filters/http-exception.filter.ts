import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common'

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();

        console.error('EXCEPTION:', exception);

        const status =
        exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

        const body = exception instanceof HttpException
        ? exception.getResponse()
        : null;

        res.status(status).json({
            statusCode: status,
            message:
            typeof body === 'string'
            ? body
            : (body as any)?.message ?? 'Internal Server Error',
            error:
            typeof body === 'object'
            ? (body as any)?.error ?? null
            : null,
            path: req.url,
            timestamp: new Date().toISOString(),
        });
    }
}