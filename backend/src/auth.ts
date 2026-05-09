import { NextFunction, Request, Response } from 'express';
import crypto from 'crypto';
import { promisify } from 'util';
import { dbGet, dbRun } from './database.js';

const scryptAsync = promisify(crypto.scrypt);
const PASSWORD_KEY_LENGTH = 64;

export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    username: string;
  };
  authTokenHash?: string;
};

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = (await scryptAsync(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
  return {
    hash: derivedKey.toString('hex'),
    salt,
  };
}

export async function verifyPassword(password: string, salt: string, expectedHash: string) {
  const { hash } = await hashPassword(password, salt);
  const hashBuffer = Buffer.from(hash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (hashBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, expectedBuffer);
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({
        success: false,
        error: 'Login is required',
      });
    }

    const tokenHash = hashToken(token);
    const session = await dbGet(
      `
      SELECT s.token_hash, s.expires_at, u.id AS user_id, u.username
      FROM user_sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?
      `,
      [tokenHash]
    );

    if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
      if (session) {
        await dbRun('DELETE FROM user_sessions WHERE token_hash = ?', [tokenHash]);
      }

      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.',
      });
    }

    req.user = {
      id: session.user_id,
      username: session.username,
    };
    req.authTokenHash = tokenHash;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
