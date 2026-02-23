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
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json(actionError('username and password required'));
      return;
    }

    const key = `user:${String(username).toLowerCase()}`;
    const user = await kv.get(key);
    if (!user) {
      res.status(404).json(actionError('user not found'));
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json(actionError('invalid credentials'));
      return;
    }

    const token = jwt.sign(
      { sub: user.username, role: user.role },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '7d' }
    );

    res.status(200).json(
      actionSuccess({ token, user: { username: user.username, role: user.role } })
    );
  } catch {
    res.status(500).json(actionError('server error'));
  }
}
