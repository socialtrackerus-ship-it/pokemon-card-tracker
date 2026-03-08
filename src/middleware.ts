export { auth as middleware } from '@/lib/auth'

export const config = {
  matcher: ['/collection/:path*', '/dashboard/:path*', '/assistant/:path*'],
}
