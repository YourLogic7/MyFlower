import { getAuthenticatedUser } from '../lib/auth.js';
import { getProgressCollection } from '../lib/mongodb.js';

const flowerIds = new Set([
  'sunflower', 'rose', 'tulip', 'daisy', 'hibiscus',
  'cherry', 'lavender', 'lily', 'chrysanthemum', 'poppy',
]);
const potTypes = new Set(['classic', 'round', 'square']);
const potColors = new Set(['terracotta', 'mint', 'lavender', 'sky', 'butter', 'rose']);
const accessories = new Set(['none', 'bow', 'crown', 'flower-clip']);

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateGarden(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const {
    flowerId,
    name,
    plantedAt,
    lastWatered,
    waterDates,
    potType = 'classic',
    potColor = 'terracotta',
    accessory = 'none',
    faceEnabled = true,
  } = body;
  if (!flowerIds.has(flowerId)) return null;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 18) return null;
  if (!isDateKey(plantedAt) || !isDateKey(lastWatered)) return null;
  if (!Array.isArray(waterDates) || waterDates.length > 10000 || !waterDates.every(isDateKey)) return null;
  if (!potTypes.has(potType) || !potColors.has(potColor) || !accessories.has(accessory)) return null;
  if (typeof faceEnabled !== 'boolean') return null;

  return {
    flowerId,
    name: name.trim(),
    plantedAt,
    lastWatered,
    waterDates: [...new Set(waterDates)],
    potType,
    potColor,
    accessory,
    faceEnabled,
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
            potType: potTypes.has(saved.potType) ? saved.potType : 'classic',
            potColor: potColors.has(saved.potColor) ? saved.potColor : 'terracotta',
            accessory: accessories.has(saved.accessory) ? saved.accessory : 'none',
            faceEnabled: typeof saved.faceEnabled === 'boolean' ? saved.faceEnabled : true,
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
