import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

// Helper function to sign in with GitHub
export const signInWithGitHub = () => {
  return signIn.social({
    provider: 'github',
    callbackURL: '/dashboard',
    scopes: ['read:user', 'user:email', 'user:read', 'repo', 'read:org'],
  });
};
