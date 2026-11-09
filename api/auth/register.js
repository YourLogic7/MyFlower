import { createSession, consumeAuthRateLimit, hashPassword, isValidPassword, isValidUsername } from '../../lib/auth.js';
import { getUsersCollection } from '../../lib/mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  const { username, password } = req.body || {};
  if (!isValidUsername(username) || !isValidPassword(password)) {
    return res.status(400).json({
      error: 'Nama pengguna harus 3–24 karakter (huruf, angka, titik, garis bawah, atau tanda hubung) dan kata sandi minimal 12 karakter.',
    });
  }

  try {
    const rateLimit = await consumeAuthRateLimit(req, 'register', 8);
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
      return res.status(429).json({ error: 'Terlalu banyak percobaan daftar. Coba lagi sebentar.' });
    }

    const users = await getUsersCollection();
    const normalizedUsername = username.toLowerCase();
    const { passwordSalt, passwordHash } = await hashPassword(password);
    let user;

    try {
      const result = await users.insertOne({
        username,
        usernameNormalized: normalizedUsername,
        passwordSalt,
        passwordHash,
        createdAt: new Date(),
      });
      user = { _id: result.insertedId, username };
    } catch (error) {
      if (error.code === 11000) return res.status(409).json({ error: 'Nama pengguna sudah digunakan.' });
      throw error;
    }

    const userResponse = await createSession(user, req, res);
    return res.status(201).json({ user: userResponse });
  } catch (error) {
    console.error('Pendaftaran akun gagal.', error);
    return res.status(500).json({ error: 'Akun tidak dapat dibuat sekarang. Coba lagi.' });
  }
}
