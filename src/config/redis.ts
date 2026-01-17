import { createClient, RedisClientType } from 'redis';

let client: RedisClientType;

/**
 * Initialise and return the shared Redis client.
 * Subsequent calls return the same connected instance.
 */
export async function getRedisClient(): Promise<RedisClientType> {
  if (client) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  client = createClient({ url });

  client.on('error', (err) => {
    console.error('[redis] connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[redis] connected to', url);
  });

  await client.connect();
  return client;
}
