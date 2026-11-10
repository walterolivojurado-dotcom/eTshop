import jwt from 'jsonwebtoken';
import config from '../config';
import { Role } from '@prisma/client';

export interface JwtAccessPayload {
  userId: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: Role;
  companyId?: string | null;
  businessId?: string | null;
  sessionId?: string;
  isGlobalViewEnabled?: boolean;
}

export interface JwtRefreshPayload {
  userId: string;
}

export const generateAccessToken = (payload: JwtAccessPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtAccessPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as JwtAccessPayload;
};

export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtRefreshPayload;
};
