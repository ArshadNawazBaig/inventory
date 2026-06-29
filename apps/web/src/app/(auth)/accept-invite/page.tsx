import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Spinner } from '@stockflow/ui';
import { AcceptInviteForm } from '@/features/auth/components/accept-invite-form';

export const metadata: Metadata = { title: 'Accept invitation · StockFlow' };

export default function AcceptInvitePage() {
  // AcceptInviteForm reads the token from the URL (useSearchParams) → needs a Suspense boundary.
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
