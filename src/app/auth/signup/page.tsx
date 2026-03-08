'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      // Auto sign-in after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push('/auth/login')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)]">
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
              <h1 className="text-2xl font-bold">Create Account</h1>
              <p className="text-sm text-muted-foreground mt-1">Start tracking your Pokemon card collection</p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
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
                  minLength={6}
                  placeholder="Choose a password"
                  className="mt-1.5 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider" htmlFor="confirm">Confirm Password</label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Confirm your password"
                  className="mt-1.5 bg-white/5 border-white/10 focus:border-[var(--holo-purple)]/50 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--holo-purple)] to-[var(--holo-blue)] text-white border-0 shadow-[0_0_20px_oklch(0.6_0.2_280_/_15%)] hover:shadow-[0_0_30px_oklch(0.6_0.2_280_/_25%)] transition-all rounded-xl h-11"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <p className="text-sm text-center mt-6 text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-gradient font-medium hover:opacity-80">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
