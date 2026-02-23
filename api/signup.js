import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function actionSuccess(data) {
  return { ok: true, data };
}

export function actionError(error) {
  return { ok: false, error };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json(actionError('Method not allowed'));
    return;
  }

  try {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      res.status(400).json(actionError('username, password, and role required'));
      return;
    }

    const normalized = String(username).trim();
    const key = `user:${normalized.toLowerCase()}`;
    const existing = await kv.get(key);
    if (existing) {
      res.status(409).json(actionError('user already exists'));
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const rec = {
      username: normalized,
      role: role === 'DM' ? 'DM' : 'Player',
      passwordHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await kv.set(key, rec);

    const token = jwt.sign(
      { sub: rec.username, role: rec.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.status(200).json(
      actionSuccess({ token, user: { username: rec.username, role: rec.role } })
    );
  } catch {
    res.status(500).json(actionError('server error'));
  }
}
