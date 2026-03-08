'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create account'); setLoading(false); return }
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) router.push('/auth/login')
      else { router.push('/'); router.refresh() }
    } catch { setError('Something went wrong'); setLoading(false) }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-display-md">Create account</h1>
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">Start tracking your collection</p>
        </div>
        <div className="surface-1 rounded-lg p-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            {error && <div className="text-[12px] loss-badge p-2.5 rounded">{error}</div>}
            <div>
              <label className="text-label block mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <div>
              <label className="text-label block mb-1.5">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Choose a password"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <div>
              <label className="text-label block mb-1.5">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Confirm password"
                className="w-full bg-[var(--surface-2)] border border-[var(--border-default)] rounded-md px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand)] transition-colors" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full text-[13px] font-medium text-white py-2.5 rounded-md bg-[var(--brand)] hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <p className="text-[12px] text-center mt-5 text-[var(--text-tertiary)]">
            Already have an account? <Link href="/auth/login" className="text-[var(--brand)] hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
