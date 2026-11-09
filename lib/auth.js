import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import {
  getAuthRateLimitsCollection,
  getSessionsCollection,
  getUsersCollection,
} from './mongodb.js';

const scrypt = promisify(scryptCallback);
const sessionCookie = 'kebun_session';
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const rateLimitWindowMs = 15 * 60 * 1000;
const passwordHashBytes = 64;
const scryptOptions = { N: 2 ** 14, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function getClientAddress(req) {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) return realIp.trim();

  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) return forwardedFor.split(',')[0].trim();

  return req.socket?.remoteAddress || 'unknown';
}

function getSessionToken(req) {
  const cookieHeader = req.headers.cookie;
  if (typeof cookieHeader !== 'string') return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0 || cookie.slice(0, separator).trim() !== sessionCookie) continue;
    const token = cookie.slice(separator + 1).trim();
    return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
  }
  return null;
}

function setSessionCookie(req, res, token, expiresAt) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = [
    `${sessionCookie}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Expires=${expiresAt.toUTCString()}`,
    `Max-Age=${Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))}`,
  ];
  if (secure) cookieOptions.push('Secure');
  res.setHeader('Set-Cookie', cookieOptions.join('; '));
}

export function setExpiredSessionCookie(req, res) {
  const secure = process.env.NODE_ENV === 'production' || req.headers['x-forwarded-proto'] === 'https';
  const cookieOptions = [
    `${sessionCookie}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
  ];
  if (secure) cookieOptions.push('Secure');
  res.setHeader('Set-Cookie', cookieOptions.join('; '));
}

export function isValidUsername(username) {
  return typeof username === 'string' && /^[A-Za-z0-9_.-]{3,24}$/.test(username);
}

export function isValidPassword(password) {
  return typeof password === 'string'
    && password.length >= 12
    && Buffer.byteLength(password, 'utf8') <= 1024;
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, passwordHashBytes, scryptOptions);
  return { passwordSalt: salt.toString('hex'), passwordHash: hash.toString('hex') };
}

export async function verifyPassword(password, user) {
  const hasValidHash = typeof user?.passwordSalt === 'string'
    && /^[a-f0-9]{32}$/i.test(user.passwordSalt)
    && typeof user.passwordHash === 'string'
    && /^[a-f0-9]{128}$/i.test(user.passwordHash);
  const salt = hasValidHash ? Buffer.from(user.passwordSalt, 'hex') : Buffer.alloc(16);
  const expectedHash = hasValidHash ? Buffer.from(user.passwordHash, 'hex') : Buffer.alloc(passwordHashBytes);
  const actualHash = await scrypt(password, salt, passwordHashBytes, scryptOptions);
  const matches = timingSafeEqual(actualHash, expectedHash);
  return Boolean(user && hasValidHash && matches);
}

export async function createSession(user, req, res) {
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + sessionLifetimeMs);
  const sessions = await getSessionsCollection();

  await sessions.insertOne({
    tokenHash: hashToken(token),
    userId: user._id,
    createdAt,
    expiresAt,
  });
  setSessionCookie(req, res, token, expiresAt);

  return { id: user._id.toString(), username: user.username };
}

export async function getAuthenticatedUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;

  const sessions = await getSessionsCollection();
  const session = await sessions.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) return null;

  const users = await getUsersCollection();
  const user = await users.findOne(
    { _id: session.userId },
    { projection: { username: 1 } },
  );
  if (!user) {
    await sessions.deleteOne({ _id: session._id });
    return null;
  }

  return { id: user._id.toString(), username: user.username };
}

export async function destroySession(req, res) {
  const token = getSessionToken(req);
  if (token) {
    const sessions = await getSessionsCollection();
    await sessions.deleteOne({ tokenHash: hashToken(token) });
  }
  setExpiredSessionCookie(req, res);
}

export async function consumeAuthRateLimit(req, identifier, limit) {
  const now = Date.now();
  const bucket = Math.floor(now / rateLimitWindowMs);
  const expiresAt = new Date((bucket + 2) * rateLimitWindowMs);
  const id = hashToken(`${getClientAddress(req)}:${identifier}:${bucket}`);
  const collection = await getAuthRateLimitsCollection();

  try {
    await collection.updateOne(
      { _id: id },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    await collection.updateOne({ _id: id }, { $inc: { count: 1 } });
  }

  const record = await collection.findOne({ _id: id }, { projection: { count: 1 } });
  return {
    allowed: record.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((rateLimitWindowMs - (now % rateLimitWindowMs)) / 1000)),
  };
}
