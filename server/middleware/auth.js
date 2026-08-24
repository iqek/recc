import { parseCookies } from '../lib/cookies.js';
import { getSessionUser } from '../repo.js';

export const SESSION_COOKIE = 'recc_session';

export async function requireAuth(req, res, next) {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  const user = token ? await getSessionUser(token) : null;
  if (!user) return res.status(401).json({ error: 'Not logged in.' });
  req.user = user;
  next();
}
