import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_PATHS = [
  '/dashboard',
  '/companies',
  '/my-company',
  '/active-shares',
  '/invitations',
  '/profile',
  '/settings',
  '/shared/company',
  '/shared-companies',
]

export async function middleware(request: NextRequest) {
  // Ne pas protéger les pages publiques et d'auth
  const { pathname } = request.nextUrl
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/shared/public') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (!isProtected) {
    return NextResponse.next()
  }

  // Pour l'instant, on laisse passer toutes les requêtes protégées
  // L'authentification sera gérée au niveau des composants
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/companies/:path*',
    '/my-company',
    '/active-shares/:path*',
    '/invitations/:path*',
    '/profile/:path*',
    '/settings/:path*',
    '/shared/company/:path*',
    '/shared-companies/:path*',
  ],
}
