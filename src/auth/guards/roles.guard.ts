import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Role } from '@prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorators'
import { Observable } from 'rxjs'
import { STATUS_CODES } from 'http'
import { error } from 'console'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor (private reflector: Reflector) {}

  canActivate (context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!requiredRoles.includes(user.role)) {
        throw new ForbiddenException({
            STATUS_CODES: HttpStatus.FORBIDDEN,
            message: 'Forbidden access!',
            error: 'forbidden'
        })
    }

    return true;
  }
}
