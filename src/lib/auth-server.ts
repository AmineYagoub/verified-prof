import { auth } from '@/lib/auth';
import { cookies } from 'next/headers';

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
    console.error('Error getting session:', error);
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
