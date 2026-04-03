import * as Sentry from '@sentry/sveltekit';
import { env } from '$env/dynamic/public';

Sentry.init({
  dsn: env.PUBLIC_SENTRY_DSN,
  enabled: Boolean(env.PUBLIC_SENTRY_DSN),
  enableLogs: true,
});

export const handleError = Sentry.handleErrorWithSentry();
