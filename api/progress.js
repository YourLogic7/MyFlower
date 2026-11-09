import { getAuthenticatedUser } from '../lib/auth.js';
import { getProgressCollection } from '../lib/mongodb.js';

const flowerIds = new Set([
  'sunflower', 'rose', 'tulip', 'daisy', 'hibiscus',
  'cherry', 'lavender', 'lily', 'chrysanthemum', 'poppy',
]);

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

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'PUT', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Metode tidak didukung.' });
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return res.status(401).json({ error: 'Silakan masuk untuk mengakses kebun.' });

    const userId = user.id;
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
