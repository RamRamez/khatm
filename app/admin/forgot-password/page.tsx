'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      }
    )

    if (resetError) {
      setError('خطایی رخ داد. لطفا دوباره تلاش کنید')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">بازیابی رمز عبور</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>فراموشی رمز عبور</CardTitle>
            <CardDescription>
              ایمیل خود را وارد کنید تا لینک بازیابی برای شما ارسال شود
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-foreground mb-2">
                    لینک بازیابی رمز عبور به ایمیل شما ارسال شد
                  </p>
                  <p className="text-sm text-muted-foreground">
                    لطفا ایمیل خود را بررسی کنید
                  </p>
                </div>
                <Link href="/admin/login">
                  <Button variant="outline" className="w-full">
                    <ArrowRight className="w-4 h-4 ml-2" />
                    بازگشت به صفحه ورود
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="example@email.com"
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                {error && (
                  <div className="text-destructive text-sm text-center">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'در حال ارسال...' : 'ارسال لینک بازیابی'}
                </Button>

                <div className="text-center text-sm">
                  <Link
                    href="/admin/login"
                    className="text-primary hover:underline"
                  >
                    <ArrowRight className="w-3 h-3 inline ml-1" />
                    بازگشت به صفحه ورود
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
