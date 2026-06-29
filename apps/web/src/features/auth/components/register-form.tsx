'use client';

import { useId } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterRequestSchema, type RegisterRequest } from '@stockflow/types';
import { Button, Field, Input, toast } from '@stockflow/ui';
import { applyApiErrorToForm } from '@/lib/forms';
import { errorMessage } from '@/lib/api';
import { useRegister } from '../use-session';
import { AuthCard } from './auth-card';

/** Self-serve signup — creates the organization and its Owner, then routes into the app. */
export function RegisterForm() {
  const router = useRouter();
  const registerMutation = useRegister();
  const orgId = useId();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterRequest>({
    resolver: zodResolver(RegisterRequestSchema),
    defaultValues: { organizationName: '', name: '', email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await registerMutation.mutateAsync(values);
      router.replace('/dashboard');
    } catch (error) {
      if (!applyApiErrorToForm(error, setError)) toast.error(errorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Create your workspace"
      description="Start managing inventory in minutes. You'll be the organization owner."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Organization name" htmlFor={orgId} error={errors.organizationName?.message}>
          <Input id={orgId} autoComplete="organization" {...register('organizationName')} />
        </Field>
        <Field label="Your name" htmlFor={nameId} error={errors.name?.message}>
          <Input id={nameId} autoComplete="name" {...register('name')} />
        </Field>
        <Field label="Email" htmlFor={emailId} error={errors.email?.message}>
          <Input id={emailId} type="email" autoComplete="email" {...register('email')} />
        </Field>
        <Field
          label="Password"
          htmlFor={passwordId}
          description="At least 8 characters."
          error={errors.password?.message}
        >
          <Input id={passwordId} type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Creating…">
          Create workspace
        </Button>
      </form>
    </AuthCard>
  );
}
