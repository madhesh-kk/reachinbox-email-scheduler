import 'dotenv/config';
import { z } from 'zod';
const config = z.object({ PORT:z.coerce.number().default(4000), JWT_SECRET:z.string().min(1), FRONTEND_URL:z.string().url(), DATABASE_URL:z.string(), REDIS_URL:z.string(), ELASTICSEARCH_URL:z.string(), GOOGLE_CLIENT_ID:z.string().optional(), GOOGLE_CLIENT_SECRET:z.string().optional(), GOOGLE_CALLBACK_URL:z.string().url(), SLACK_CLIENT_ID:z.string().optional(), SLACK_CLIENT_SECRET:z.string().optional(), SLACK_REDIRECT_URI:z.string().url(), WORKER_CONCURRENCY:z.coerce.number().positive(), MIN_DELAY_BETWEEN_EMAILS_MS:z.coerce.number().nonnegative(), MAX_EMAILS_PER_HOUR_PER_SENDER:z.coerce.number().positive() });
export const env = config.parse(process.env);
