import { MongoClient } from 'mongodb';

let clientPromise = globalThis.kebunMongoClientPromise;
let collectionPromise = globalThis.kebunProgressCollectionPromise;

export async function getProgressCollection() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');

  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    clientPromise = client.connect().catch((error) => {
      clientPromise = undefined;
      globalThis.kebunMongoClientPromise = undefined;
      throw error;
    });
    globalThis.kebunMongoClientPromise = clientPromise;
  }

  if (!collectionPromise) {
    collectionPromise = (async () => {
      const client = await clientPromise;
      const collection = client
        .db(process.env.MONGODB_DB || 'kebun_kecil')
        .collection('flower_progress');
      await collection.createIndex({ userId: 1 }, { unique: true });
      return collection;
    })().catch((error) => {
      collectionPromise = undefined;
      globalThis.kebunProgressCollectionPromise = undefined;
      throw error;
    });
    globalThis.kebunProgressCollectionPromise = collectionPromise;
  }

  return collectionPromise;
}
