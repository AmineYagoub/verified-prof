import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <div className="mt-12 flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-48 w-48 text-base-content/10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            />
          </svg>
        </div>
        <h1 className="text-9xl font-bold text-primary/20">404</h1>
        <h2 className="mt-4 text-2xl font-bold text-base-content">
          Profile Not Found
        </h2>
        <p className="mt-2 text-base-content/70">
          The engineering profile you&apos;re looking for doesn&apos;t exist or
          has been removed.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/" className="btn btn-primary rounded-full">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
