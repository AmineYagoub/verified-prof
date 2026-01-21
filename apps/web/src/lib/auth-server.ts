import { cookies } from 'next/headers';
import { auth } from './auth';
import { logger } from '@verified-prof/shared';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('verified-prof.session_token')?.value;
  if (!sessionToken) {
    return null;
  }
  try {
    const session = await auth.api.getSession({
      headers: {
        cookie: `verified-prof.session_token=${sessionToken}`,
      },
    });
    return session;
  } catch (error) {
    logger.error('Error getting session:', error);
    return null;
  }
}

export async function requireAuth() {
  const session = await getSession();
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
}
