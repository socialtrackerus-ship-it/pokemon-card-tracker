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
    if (result?.error) { setError('Invalid email or password'); setLoading(false) }
    else { router.push(callbackUrl); router.refresh() }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-display-md">Welcome back</h1>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1">Sign in to your account</p>
      </div>
      <div className="surface-1 rounded-lg p-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="text-[12px] loss-badge p-2.5 rounded">{error}</div>}
          <div>
            <label className="text-label block mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
          </div>
          <div>
            <label className="text-label block mb-1.5">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Enter your password"
              className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full text-[13px] font-medium text-white py-2.5 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="text-[12px] text-center mt-5 text-[var(--text-tertiary)]">
          No account? <Link href="/auth/signup" className="text-[var(--brand)] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Suspense fallback={<div className="text-[var(--text-tertiary)]">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
