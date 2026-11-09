import { createClient } from '@supabase/supabase-js';
import { getProgressCollection } from '../lib/mongodb.js';

const flowerIds = new Set([
  'sunflower', 'rose', 'tulip', 'daisy', 'hibiscus',
  'cherry', 'lavender', 'lily', 'chrysanthemum', 'poppy',
]);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    })
  : null;

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateGarden(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const { flowerId, name, plantedAt, lastWatered, waterDates } = body;
  if (!flowerIds.has(flowerId)) return null;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 18) return null;
  if (!isDateKey(plantedAt) || !isDateKey(lastWatered)) return null;
  if (!Array.isArray(waterDates) || waterDates.length > 10000 || !waterDates.every(isDateKey)) return null;

  return {
    flowerId,
    name: name.trim(),
    plantedAt,
    lastWatered,
    waterDates: [...new Set(waterDates)],
  };
}

async function getUserId(req, res) {
  if (!supabase) {
    res.status(500).json({ error: 'Autentikasi belum dikonfigurasi di server.' });
    return null;
  }

  const authorization = req.headers.authorization;
  const token = typeof authorization === 'string' && authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) {
    res.status(401).json({ error: 'Silakan masuk untuk mengakses kebun.' });
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || typeof data.user?.id !== 'string' || !data.user.id) {
      if (error) console.warn('Supabase rejected a progress API token.', error.message);
      res.status(401).json({ error: 'Sesi masuk tidak valid.' });
      return null;
    }
    return data.user.id;
  } catch (error) {
    console.warn('Supabase token verification failed.', error.message);
    res.status(401).json({ error: 'Sesi masuk tidak valid atau sudah kedaluwarsa.' });
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  const userId = await getUserId(req, res);
  if (!userId) return;

  try {
    const progress = await getProgressCollection();

    if (req.method === 'GET') {
      const saved = await progress.findOne({ userId });
      const garden = saved
        ? {
            flowerId: saved.flowerId,
            name: saved.name,
            plantedAt: saved.plantedAt,
            lastWatered: saved.lastWatered,
            waterDates: Array.isArray(saved.waterDates) ? saved.waterDates : [saved.lastWatered],
          }
        : null;
      return res.status(200).json({ garden });
    }

    if (req.method === 'PUT') {
      const garden = validateGarden(req.body);
      if (!garden) return res.status(400).json({ error: 'Data kebun tidak valid.' });

      await progress.updateOne(
        { userId },
        { $set: { ...garden, userId, updatedAt: new Date() } },
        { upsert: true },
      );
      return res.status(200).json({ garden });
    }

    await progress.deleteOne({ userId });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Progress API failed.', error);
    return res.status(500).json({ error: 'Progres kebun gagal diproses. Coba lagi.' });
  }
}
