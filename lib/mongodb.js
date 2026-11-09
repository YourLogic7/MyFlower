import { MongoClient } from 'mongodb';

let clientPromise = globalThis.kebunMongoClientPromise;
let databasePromise = globalThis.kebunMongoDatabasePromise;

async function getDatabase() {
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

  if (!databasePromise) {
    databasePromise = clientPromise.then((client) => (
      client.db(process.env.MONGODB_DB || 'kebun_kecil')
    )).catch((error) => {
      databasePromise = undefined;
      globalThis.kebunMongoDatabasePromise = undefined;
      throw error;
    });
    globalThis.kebunMongoDatabasePromise = databasePromise;
  }

  return databasePromise;
}

async function getCollection(globalKey, name, indexes) {
  let collectionPromise = globalThis[globalKey];
  if (!collectionPromise) {
    collectionPromise = (async () => {
      const database = await getDatabase();
      const collection = database.collection(name);
      await Promise.all(indexes.map(([key, options]) => collection.createIndex(key, options)));
      return collection;
    })().catch((error) => {
      globalThis[globalKey] = undefined;
      throw error;
    });
    globalThis[globalKey] = collectionPromise;
  }
  return collectionPromise;
}

export function getProgressCollection() {
  return getCollection('kebunProgressCollectionPromise', 'flower_progress', [
    [{ userId: 1 }, { unique: true }],
  ]);
}

export function getUsersCollection() {
  return getCollection('kebunUsersCollectionPromise', 'users', [
    [{ usernameNormalized: 1 }, { unique: true }],
  ]);
}

export function getSessionsCollection() {
  return getCollection('kebunSessionsCollectionPromise', 'sessions', [
    [{ tokenHash: 1 }, { unique: true }],
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
    [{ userId: 1 }, {}],
  ]);
}

export function getAuthRateLimitsCollection() {
  return getCollection('kebunAuthRateLimitsCollectionPromise', 'auth_rate_limits', [
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  ]);
}
