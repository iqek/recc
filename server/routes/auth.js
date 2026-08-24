import { Router } from 'express';
import { createUser, getUserByUsername, createSession, deleteSession, getSessionUser } from '../repo.js';
import { hashPassword, verifyPassword, generateSessionToken } from '../auth.js';
import { parseCookies, serializeCookie } from '../lib/cookies.js';
import { SESSION_COOKIE } from '../middleware/auth.js';

const SESSION_DAYS = 30;

export const authRouter = Router();

async function startSession(res, userId) {
  const token = generateSessionToken();
  await createSession(token, userId, SESSION_DAYS);
  res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, token, SESSION_DAYS * 24 * 60 * 60));
}

authRouter.post('/register', async (req, res, next) => {
  try {
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');
    if (username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    if (await getUserByUsername(username)) return res.status(409).json({ error: 'That username is taken.' });

    const user = await createUser(username, hashPassword(password));
    await startSession(res, user.id);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username ?? '').trim();
    const password = String(req.body.password ?? '');
    const user = await getUserByUsername(username);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }
    await startSession(res, user.id);
    res.json({ user: { id: user.id, username: user.username } });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) await deleteSession(token);
    res.setHeader('Set-Cookie', serializeCookie(SESSION_COOKIE, '', 0));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

authRouter.get('/me', async (req, res, next) => {
  try {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    const user = token ? await getSessionUser(token) : null;
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
