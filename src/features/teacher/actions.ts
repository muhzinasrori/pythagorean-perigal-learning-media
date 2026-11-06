'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function loginTeacher(formData: FormData) {
  const code = formData.get('accessCode')?.toString().trim() ?? '';
  const expectedCode = process.env.TEACHER_ACCESS_CODE ?? '';

  if (expectedCode && code !== expectedCode) {
    return { success: false, error: 'Incorrect access code' };
  }

  const cookieStore = await cookies();
  cookieStore.set('teacher_code', code, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 3600,
    path: '/',
  });

  revalidatePath('/teacher');
  return { success: true };
}

export async function logoutTeacher() {
  const cookieStore = await cookies();
  cookieStore.delete('teacher_code');
  revalidatePath('/teacher');
}
