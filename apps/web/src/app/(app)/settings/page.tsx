import type { Metadata } from 'next';
import { SettingsForm } from '@/features/settings/components/settings-form';

export const metadata: Metadata = { title: 'Settings · StockFlow' };

export default function SettingsPage() {
  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Organization preferences and inventory policy.</p>
      </header>
      <SettingsForm />
    </div>
  );
}
