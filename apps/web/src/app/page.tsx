import Link from 'next/link';
import { getSession } from '../lib/auth-server';
import HomePage from '../components/home/HomePage';

export default async function Home() {
  const session = await getSession();

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome back!</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <HomePage />;
}
