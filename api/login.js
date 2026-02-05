import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export function normalizeUsernameForKey(username) {
  return String(username ?? "").trim().toLowerCase();
}

export function getJwtSecretOrThrow() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return secret;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed', data: null });
    return;
  }
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ success: false, message: 'username and password required', data: null });
      return;
    }
    const key = `user:${normalizeUsernameForKey(username)}`;
    const user = await kv.get(key);
    if (!user) {
      res.status(404).json({ success: false, message: 'user not found', data: null });
      return;
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ success: false, message: 'invalid credentials', data: null });
      return;
    }
    const token = jwt.sign(
      { sub: user.username, role: user.role },
      getJwtSecretOrThrow(),
      { algorithm: 'HS256', expiresIn: '7d' }
    );
    res.status(200).json({ success: true, message: 'ok', data: { token, user: { username: user.username, role: user.role } } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'server error', data: null });
  }
}
