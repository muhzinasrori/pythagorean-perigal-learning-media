'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, KeyRound, AlertCircle } from 'lucide-react';
import { loginTeacher } from './actions';

export function TeacherLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginTeacher(formData);
      if (!res.success) {
        setError(res.error ?? 'Invalid access code');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md rounded-3xl border-stone-200 shadow-xl">
        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-teal-100 text-teal-800">
            <Lock className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-extrabold text-stone-900">
            Teacher Dashboard
          </CardTitle>
          <CardDescription className="text-sm text-stone-600">
            Please enter the teacher access code configured for your school or classroom.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessCode" className="text-sm font-semibold text-stone-700">
                Access Code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-stone-400" />
                <Input
                  id="accessCode"
                  name="accessCode"
                  type="password"
                  placeholder="Enter code..."
                  required
                  className="pl-10 min-h-11 rounded-xl"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full min-h-11 rounded-xl bg-teal-700 hover:bg-teal-800 text-base font-semibold"
            >
              {loading ? 'Verifying...' : 'Unlock Dashboard'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
