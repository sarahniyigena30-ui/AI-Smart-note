import { Router, Response } from 'express';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun } from '../database.js';
import {
  AuthenticatedRequest,
  hashPassword,
  hashToken,
  requireAuth,
  verifyPassword,
} from '../auth.js';

const router = Router();
const SESSION_DAYS = 7;

const normalizeUsername = (username: unknown) =>
  typeof username === 'string' ? username.trim().toLowerCase() : '';

const validateCredentials = (username: string, password: unknown) => {
  if (!username || username.length < 3 || username.length > 100) {
    return 'Username must be between 3 and 100 characters.';
  }

  if (!/^[a-z0-9_.-]+$/.test(username)) {
    return 'Username can only contain letters, numbers, dots, underscores, and hyphens.';
  }

  if (typeof password !== 'string' || password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
};

async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await dbRun(
    'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, tokenHash, expiresAt]
  );

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

router.post('/register', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;
    const validationError = validateCredentials(username, password);

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: validationError,
      });
    }

    const existingUser = await dbGet('SELECT id FROM users WHERE username = ?', [username]);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'An account with this username already exists.',
      });
    }

    const { hash, salt } = await hashPassword(password);
    const userId = uuidv4();

    await dbRun(
      'INSERT INTO users (id, username, password_hash, password_salt) VALUES (?, ?, ?, ?)',
      [userId, username, hash, salt]
    );

    const session = await createSession(userId);

    res.status(201).json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        user: {
          id: userId,
          username,
        },
      },
      message: 'Account created successfully.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account.',
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = req.body.password;

    if (!username || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required.',
      });
    }

    const user = await dbGet(
      'SELECT id, username, password_hash, password_salt FROM users WHERE username = ?',
      [username]
    );

    if (!user || !(await verifyPassword(password, user.password_salt, user.password_hash))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password.',
      });
    }

    const session = await createSession(user.id);

    res.json({
      success: true,
      data: {
        token: session.token,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          username: user.username,
        },
      },
      message: 'Logged in successfully.',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login.',
    });
  }
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (req.authTokenHash) {
    await dbRun('DELETE FROM user_sessions WHERE token_hash = ?', [req.authTokenHash]);
  }

  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

export default router;
