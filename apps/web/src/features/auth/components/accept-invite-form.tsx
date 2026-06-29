'use client';

import { useId } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { AcceptInvitationRequestSchema } from '@stockflow/types';
import { Button, Field, Input, toast } from '@stockflow/ui';
import { applyApiErrorToForm } from '@/lib/forms';
import { errorMessage } from '@/lib/api';
import { useAcceptInvite } from '../use-session';
import { AuthCard } from './auth-card';

/** The visible fields — the token comes from the invitation link, not the form. */
const FormSchema = AcceptInvitationRequestSchema.omit({ token: true });
type FormValues = z.infer<typeof FormSchema>;

/** Accept an invitation: set name + password, join the org, and route into the app. */
export function AcceptInviteForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');
  const acceptMutation = useAcceptInvite();
  const nameId = useId();
  const passwordId = useId();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', password: '' },
  });

  if (!token) {
    return (
      <AuthCard
        title="Invalid invitation"
        description="This invitation link is missing or malformed. Ask your admin to resend it."
        footer={
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <span className="sr-only">Missing invitation token.</span>
      </AuthCard>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await acceptMutation.mutateAsync({ ...values, token });
      router.replace('/dashboard');
    } catch (error) {
      if (!applyApiErrorToForm(error, setError)) toast.error(errorMessage(error));
    }
  });

  return (
    <AuthCard
      title="Accept your invitation"
      description="Set your name and a password to join the organization."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Field label="Your name" htmlFor={nameId} error={errors.name?.message}>
          <Input id={nameId} autoComplete="name" {...register('name')} />
        </Field>
        <Field
          label="Password"
          htmlFor={passwordId}
          description="At least 8 characters."
          error={errors.password?.message}
        >
          <Input id={passwordId} type="password" autoComplete="new-password" {...register('password')} />
        </Field>
        <Button type="submit" className="w-full" loading={isSubmitting} loadingText="Joining…">
          Join organization
        </Button>
      </form>
    </AuthCard>
  );
}
