import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { database } from './db';
import * as schema from './db/schema';
let instance: ReturnType<typeof betterAuth> | undefined;
export function getAuth() {
  return instance ??= betterAuth({
    database: drizzleAdapter(database(), { provider: 'pg', schema }),
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    socialProviders: { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 60 },
  });
}
