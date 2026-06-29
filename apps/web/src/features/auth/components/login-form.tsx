'use client';

import { useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginRequestSchema, type LoginRequest } from '@stockflow/types';
import { Button, Field, Input, toast } from '@stockflow/ui';
import { applyApiErrorToForm } from '@/lib/forms';
import { errorMessage } from '@/lib/api';
import { useLogin } from '../use-session';
import { AuthCard } from './auth-card';

/** Email + password sign-in. On success the session cookie is set and we route into the app. */
export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();
  const emailId = useId();
  const passwordId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await loginMutation.mutateAsync(values);
      router.replace('/dashboard');
    } catch (error) {
      if (!applyApiErrorToForm(error, setError)) toast.error(errorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to your StockFlow workspace."
      footer={
        <>
          New to StockFlow?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Email" htmlFor={emailId} error={errors.email?.message}>
          <Input id={emailId} type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field label="Password" htmlFor={passwordId} error={errors.password?.message}>
          <Input id={passwordId} type="password" autoComplete="current-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Signing in…">
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}
