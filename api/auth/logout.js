import { destroySession } from '../../lib/auth.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  try {
    await destroySession(req, res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Logout gagal.', error);
    return res.status(500).json({ error: 'Logout tidak dapat diproses sekarang. Coba lagi.' });
  }
}
