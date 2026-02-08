import { auth } from '@verified-prof/shared';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session?.user) {
      return NextResponse.json({
        user: {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        },
      });
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
