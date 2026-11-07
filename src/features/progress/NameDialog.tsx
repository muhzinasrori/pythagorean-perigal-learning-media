'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Check, UserPen } from 'lucide-react';
import { getDisplayName, setDisplayName, ensureStudentRegistered } from './identity';

interface NameDialogProps {
  className?: string;
}

export function NameDialog({ className }: NameDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');

  // Synchronize on mount once after SSR hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = getDisplayName();
      if (current) {
        setName(current);
        setSavedName(current);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      const current = getDisplayName();
      setName(current);
      setSavedName(current);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim().slice(0, 24);
    setDisplayName(trimmed);
    setSavedName(trimmed);
    ensureStudentRegistered();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={`min-h-11 gap-1.5 rounded-full bg-white/15 px-3 text-white shadow-none hover:bg-white/25 hover:text-white ${className}`}
          aria-label="Set student name"
          title="Set student display name"
        >
          {savedName ? (
            <>
              <User className="h-4 w-4 text-amber-300" aria-hidden="true" />
              <span className="max-w-[120px] truncate text-xs font-semibold sm:inline">
                {savedName}
              </span>
            </>
          ) : (
            <>
              <UserPen className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline text-xs font-semibold">Set Name</span>
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-stone-900">
              <User className="h-5 w-5 text-teal-600" />
              Student Profile · Nama Siswa
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-600">
              Enter your name or nickname to appear on the <strong>Speed Challenge Leaderboard</strong> and <strong>Teacher Dashboard</strong>. No password needed!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="student-name" className="text-sm font-semibold text-stone-700">
              Your Name / Nickname
            </Label>
            <Input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alya, Budi Kelas 8B..."
              maxLength={24}
              className="min-h-11 rounded-xl"
              autoFocus
            />
            <p className="text-[11px] text-stone-400">Maximum 24 characters</p>
          </div>

          <DialogFooter className="flex sm:justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="min-h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-h-10 gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold"
            >
              <Check className="h-4 w-4" /> Save Name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
