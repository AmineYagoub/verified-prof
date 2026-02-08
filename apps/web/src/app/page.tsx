import { redirect } from 'next/navigation';
import { getSession } from '../lib/auth-server';
import HomePage from '../components/home/HomePage';

export default async function Home() {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }
  return <HomePage />;
}
