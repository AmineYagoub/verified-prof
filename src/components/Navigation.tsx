import Image from 'next/image';
import Link from 'next/link';

interface NavigationProps {
  isLoggedIn?: boolean;
}

export const Navigation = ({ isLoggedIn = false }: NavigationProps) => (
  <nav className='relative z-10 navbar bg-base-100/80 backdrop-blur-sm shadow-sm'>
    <div className='flex-1'>
      <Link href='/'>
        <Image
          src='/images/verified-prof-logo.png'
          alt='Verified Prof Logo'
          width={130}
          height={75}
          className='object-contain h-auto w-auto'
          loading='eager'
        />
      </Link>
    </div>
    <div className='flex-none gap-2'>
      {isLoggedIn ? (
        <Link href='/dashboard' className='btn btn-primary'>
          Dashboard
        </Link>
      ) : (
        <>
          <Link href='/login' className='btn btn-ghost'>
            Sign In
          </Link>
          <Link href='/signup' className='btn btn-primary'>
            Get Started
          </Link>
        </>
      )}
    </div>
  </nav>
);
