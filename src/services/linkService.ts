import { getRedisClient } from '../config/redis';
import { generateShortId } from '../utils/shortId';
import { LinkRecord, CreateLinkRequest } from '../types';

// Redis key prefixes
const LINK_PREFIX = 'link:';
const ALIAS_INDEX = 'alias_index';

/**
 * Create a new shortened link and persist it in Redis.
 * Supports optional custom aliases and TTL-based expiration.
 */
export async function createLink(payload: CreateLinkRequest): Promise<LinkRecord> {
  const redis = await getRedisClient();
  const { url, customAlias, expiresIn } = payload;

  // Determine the short ID (custom alias or random)
  let shortId: string;
  if (customAlias) {
    const existing = await redis.get(`${LINK_PREFIX}${customAlias}`);
    if (existing) {
      throw new Error('Custom alias is already taken');
    }
    shortId = customAlias;
  } else {
    shortId = generateShortId();
    // Extremely unlikely collision check
    while (await redis.get(`${LINK_PREFIX}${shortId}`)) {
      shortId = generateShortId();
    }
  }

  const now = new Date();
  const record: LinkRecord = {
    shortId,
    originalUrl: url,
    customAlias: customAlias || undefined,
    createdAt: now.toISOString(),
    expiresAt: expiresIn
      ? new Date(now.getTime() + expiresIn * 1000).toISOString()
      : undefined,
    clicks: 0,
  };

  const key = `${LINK_PREFIX}${shortId}`;
  await redis.set(key, JSON.stringify(record));

  // Apply TTL when an expiration was requested
  if (expiresIn) {
    await redis.expire(key, expiresIn);
  }

  // Track the link in a global set so we can list them later
  await redis.sAdd(ALIAS_INDEX, shortId);

  return record;
}

/**
 * Retrieve a link record by its short ID.
 */
export async function getLinkByShortId(shortId: string): Promise<LinkRecord | null> {
  const redis = await getRedisClient();
  const raw = await redis.get(`${LINK_PREFIX}${shortId}`);
  if (!raw) return null;
  return JSON.parse(raw) as LinkRecord;
}

/**
 * Increment the click counter stored on the link record.
 */
export async function incrementClicks(shortId: string): Promise<void> {
  const redis = await getRedisClient();
  const key = `${LINK_PREFIX}${shortId}`;
  const raw = await redis.get(key);
  if (!raw) return;

  const record: LinkRecord = JSON.parse(raw);
  record.clicks += 1;

  // Preserve remaining TTL if the key has one
  const ttl = await redis.ttl(key);
  await redis.set(key, JSON.stringify(record));
  if (ttl > 0) {
    await redis.expire(key, ttl);
  }
}

/**
 * List all tracked short links.
 */
export async function listLinks(): Promise<LinkRecord[]> {
  const redis = await getRedisClient();
  const ids = await redis.sMembers(ALIAS_INDEX);

  const links: LinkRecord[] = [];
  for (const id of ids) {
    const raw = await redis.get(`${LINK_PREFIX}${id}`);
    if (raw) {
      links.push(JSON.parse(raw) as LinkRecord);
    }
  }

  // Most recent first
  links.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return links;
}
