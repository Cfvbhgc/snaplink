import { getRedisClient } from '../config/redis';
import { parseUserAgent } from '../utils/userAgent';
import { ClickEvent, LinkAnalytics } from '../types';
import { getLinkByShortId } from './linkService';

// Redis key helpers
const clicksKey = (id: string) => `clicks:${id}`;
const dailyKey = (id: string) => `clicks_daily:${id}`;
const referrersKey = (id: string) => `referrers:${id}`;
const browsersKey = (id: string) => `browsers:${id}`;
const osKey = (id: string) => `os:${id}`;
const devicesKey = (id: string) => `devices:${id}`;
const countriesKey = (id: string) => `countries:${id}`;

/**
 * Record a single click event.
 * Stores the raw event and updates all aggregate counters.
 */
export async function recordClick(
  shortId: string,
  ip: string,
  userAgent: string,
  referrer: string
): Promise<void> {
  const redis = await getRedisClient();
  const parsed = parseUserAgent(userAgent);

  const event: ClickEvent = {
    timestamp: new Date().toISOString(),
    ip,
    userAgent,
    referrer: referrer || 'direct',
    browser: parsed.browser,
    os: parsed.os,
    device: parsed.device,
    // IP-based geo lookup would require a third-party service;
    // we store the IP and label it "Unknown" for now.
    country: 'Unknown',
  };

  // Push raw event to a list (capped to last 10 000 events)
  await redis.lPush(clicksKey(shortId), JSON.stringify(event));
  await redis.lTrim(clicksKey(shortId), 0, 9999);

  // Increment daily counter (YYYY-MM-DD)
  const day = event.timestamp.slice(0, 10);
  await redis.hIncrBy(dailyKey(shortId), day, 1);

  // Aggregate dimensions
  await redis.hIncrBy(referrersKey(shortId), event.referrer, 1);
  await redis.hIncrBy(browsersKey(shortId), event.browser, 1);
  await redis.hIncrBy(osKey(shortId), event.os, 1);
  await redis.hIncrBy(devicesKey(shortId), event.device, 1);
  await redis.hIncrBy(countriesKey(shortId), event.country, 1);
}

/**
 * Build a full analytics report for a given short link.
 */
export async function getAnalytics(shortId: string): Promise<LinkAnalytics | null> {
  const link = await getLinkByShortId(shortId);
  if (!link) return null;

  const redis = await getRedisClient();

  const [clicksOverTime, topReferrers, browsers, operatingSystems, devices, countries] =
    await Promise.all([
      redis.hGetAll(dailyKey(shortId)),
      redis.hGetAll(referrersKey(shortId)),
      redis.hGetAll(browsersKey(shortId)),
      redis.hGetAll(osKey(shortId)),
      redis.hGetAll(devicesKey(shortId)),
      redis.hGetAll(countriesKey(shortId)),
    ]);

  // Convert string values to numbers
  const toNumbers = (obj: Record<string, string>): Record<string, number> =>
    Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, parseInt(v, 10)]));

  return {
    shortId,
    originalUrl: link.originalUrl,
    totalClicks: link.clicks,
    clicksOverTime: toNumbers(clicksOverTime),
    topReferrers: toNumbers(topReferrers),
    browsers: toNumbers(browsers),
    operatingSystems: toNumbers(operatingSystems),
    devices: toNumbers(devices),
    countries: toNumbers(countries),
  };
}

/**
 * Return basic stats (total clicks) for a short link.
 */
export async function getBasicStats(shortId: string) {
  const link = await getLinkByShortId(shortId);
  if (!link) return null;

  return {
    shortId: link.shortId,
    originalUrl: link.originalUrl,
    clicks: link.clicks,
    createdAt: link.createdAt,
    expiresAt: link.expiresAt,
  };
}
