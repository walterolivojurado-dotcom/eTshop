import { Request } from 'express';
import { JwtAccessPayload } from '../lib/jwt';

export interface AuthRequest extends Request {
  user?: JwtAccessPayload;
}
