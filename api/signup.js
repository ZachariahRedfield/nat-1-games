import { kv } from "@vercel/kv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method not allowed', data: null });
    return;
  }
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password || !role) {
      res.status(400).json({ success: false, message: 'username, password, and role required', data: null });
      return;
    }
    const normalized = String(username).trim();
    const key = `user:${normalized.toLowerCase()}`;
    const existing = await kv.get(key);
    if (existing) {
      res.status(409).json({ success: false, message: 'user already exists', data: null });
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
    res.status(200).json({ success: true, message: 'signed up', data: { token, user: { username: rec.username, role: rec.role } } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'server error', data: null });
  }
}

