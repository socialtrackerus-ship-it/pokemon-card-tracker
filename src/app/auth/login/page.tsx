'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

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
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  return (
    <div className="w-full max-w-sm animate-in">
      {/* Brand Lockup */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-full bg-[var(--brand)] flex items-center justify-center mb-3">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" fill="white" />
            <line x1="2" y1="12" x2="9" y2="12" stroke="white" strokeWidth="2" />
            <line x1="15" y1="12" x2="22" y2="12" stroke="white" strokeWidth="2" />
          </svg>
        </div>
        <span className="text-display-sm font-display brand-text">PokeVault</span>
      </div>

      {/* Heading */}
      <div className="text-center mb-6">
        <h1 className="text-display-md font-display">Welcome back</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1.5">Sign in to access your vault</p>
      </div>

      {/* Form Panel */}
      <div className="panel">
        <div className="panel-body">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="loss-badge text-[12px] px-3 py-2.5 rounded-lg flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}
            <div>
              <label className="text-label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="input-premium w-full"
              />
            </div>
            <div>
              <label className="text-label block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                className="input-premium w-full"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Link */}
      <p className="text-[12px] text-center mt-6 text-[var(--text-tertiary)]">
        No account?{' '}
        <Link href="/auth/signup" className="text-[var(--brand)] hover:underline font-medium">
          Create one
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="section-brand min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <Suspense
        fallback={
          <div className="w-full max-w-sm space-y-4">
            <div className="h-12 w-12 skeleton rounded-full mx-auto" />
            <div className="h-8 w-40 skeleton rounded mx-auto" />
            <div className="h-64 skeleton rounded-lg" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
