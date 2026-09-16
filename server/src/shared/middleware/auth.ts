import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const secret = process.env.JWT_SECRET ?? process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    return res.status(500).json({ message: 'JWT secret is not configured' });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (typeof payload !== 'object' || payload === null || typeof payload.userId !== 'string') {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = { userId: payload.userId };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}
