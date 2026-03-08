'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[var(--holo-purple)] opacity-[0.04] blur-[60px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[var(--holo-blue)] opacity-[0.04] blur-[60px] pointer-events-none" />

        <div className="relative p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--holo-purple)] to-[var(--holo-blue)] flex items-center justify-center mx-auto mb-4 opacity-80">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
                <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your PokeVault account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                {error}
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="mt-1.5 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="password">Password</label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="mt-1.5 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 shadow-[0_0_20px_oklch(0.6_0.2_280_/_15%)] hover:shadow-[0_0_30px_oklch(0.6_0.2_280_/_25%)] transition-all rounded-xl h-11"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="text-sm text-center mt-6 text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-gradient font-medium hover:opacity-80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
