import { getSession } from '@verified-prof/web/lib/auth-server';
import { redirect } from 'next/navigation';
import { signOut } from '@verified-prof/web/lib/auth-client';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Dashboard</a>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
            >
              <div className="w-10 rounded-full">
                {session.user.image ? (
                  <img alt="User avatar" src={session.user.image} />
                ) : (
                  <div className="flex items-center justify-center h-full bg-primary text-primary-content">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li>
                <a className="justify-between">
                  Profile
                  <span className="badge">New</span>
                </a>
              </li>
              <li>
                <a>Settings</a>
              </li>
              <li>
                <form
                  action={async () => {
                    'use server';
                    await signOut();
                  }}
                >
                  <button type="submit" className="w-full text-left">
                    Logout
                  </button>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-8">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl">
              Welcome, {session.user.name}!
            </h2>
            <p className="text-base-content/70">
              You are logged in successfully.
            </p>

            <div className="divider"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">Email</div>
                <div className="stat-value text-lg">{session.user.email}</div>
              </div>

              <div className="stat bg-base-200 rounded-box">
                <div className="stat-title">User ID</div>
                <div className="stat-value text-lg">{session.user.id}</div>
              </div>

              {session.user.emailVerified && (
                <div className="stat bg-base-200 rounded-box">
                  <div className="stat-title">Email Verified</div>
                  <div className="stat-value text-lg text-success">Yes</div>
                </div>
              )}

              {session.user.createdAt && (
                <div className="stat bg-base-200 rounded-box">
                  <div className="stat-title">Account Created</div>
                  <div className="stat-value text-lg">
                    {new Date(session.user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
