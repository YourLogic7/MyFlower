import { getAuthenticatedUser } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Silakan masuk untuk melanjutkan.' });
    return res.status(200).json({ user });
  } catch (error) {
    console.error('Sesi akun tidak dapat diperiksa.', error);
    return res.status(500).json({ error: 'Sesi akun tidak dapat diperiksa sekarang.' });
  }
}
