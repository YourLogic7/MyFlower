import { consumeAuthRateLimit, createSession, verifyPassword } from '../../lib/auth.js';
import { getUsersCollection } from '../../lib/mongodb.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  const { username, password } = req.body || {};
  if (typeof username !== 'string' || typeof password !== 'string' || password.length > 1024) {
    return res.status(400).json({ error: 'Isi nama pengguna dan kata sandi.' });
  }

  try {
    const normalizedUsername = username.toLowerCase();
    const byAddress = await consumeAuthRateLimit(req, 'login', 30);
    const byAccount = await consumeAuthRateLimit(req, `login:${normalizedUsername}`, 10);
    if (!byAddress.allowed || !byAccount.allowed) {
      const retryAfter = Math.max(byAddress.retryAfterSeconds, byAccount.retryAfterSeconds);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({ error: 'Terlalu banyak percobaan masuk. Coba lagi sebentar.' });
    }

    const users = await getUsersCollection();
    const user = await users.findOne({ usernameNormalized: normalizedUsername });
    const passwordMatches = await verifyPassword(password, user);
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Nama pengguna atau kata sandi salah.' });
    }

    const userResponse = await createSession(user, req, res);
    return res.status(200).json({ user: userResponse });
  } catch (error) {
    console.error('Login gagal.', error);
    return res.status(500).json({ error: 'Login tidak dapat diproses sekarang. Coba lagi.' });
  }
}
