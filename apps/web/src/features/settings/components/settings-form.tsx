'use client';

import { useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Skeleton,
  Switch,
  toast,
} from '@stockflow/ui';
import type { OrganizationSettingsResponse } from '@stockflow/types';
import { ErrorState } from '@/components/errors';
import { errorMessage } from '@/lib/api';
import { useSettings } from '../queries';
import { useUpdateSettings } from '../mutations';
import {
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  settingsFormSchema,
  toSettingsForm,
  toUpdateRequest,
  type SettingsFormValues,
} from '../lib/forms';

/** Merge the current value into a curated option list so a custom saved value still shows. */
function withCurrent(options: readonly string[], current: string): string[] {
  return options.includes(current) ? [...options] : [current, ...options];
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} aria-label={label} />
    </div>
  );
}

function SettingsFormFields({ settings }: { settings: OrganizationSettingsResponse }) {
  const formId = useId();
  const update = useUpdateSettings();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: toSettingsForm(settings),
    mode: 'onBlur',
  });

  const currencyOptions = withCurrent(CURRENCY_OPTIONS, settings.defaultCurrency);
  const timezoneOptions = withCurrent(TIMEZONE_OPTIONS, settings.timezone);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await update.mutateAsync(toUpdateRequest(values));
      toast.success('Settings saved');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  });

  return (
    <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field label="Default currency" description="New documents default to this currency.">
            <Controller
              control={control}
              name="defaultCurrency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Default currency" placeholder="Currency" />
                  <SelectContent>
                    {currencyOptions.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Timezone" description="Used to render dates across the app.">
            <Controller
              control={control}
              name="timezone"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Timezone" placeholder="Timezone" />
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Controller
            control={control}
            name="allowNegativeStock"
            render={({ field }) => (
              <ToggleRow
                label="Allow negative stock"
                description="When on, shipments and removals can drive on-hand below zero. Off keeps the ledger guarded."
                checked={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          <Controller
            control={control}
            name="lowStockAlertsEnabled"
            render={({ field }) => (
              <ToggleRow
                label="Low-stock alerts"
                description="Notify when a variant drops to or below its reorder point."
                checked={field.value}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" form={formId} loading={isSubmitting} loadingText="Saving…" disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

/** Organization settings editor — loads the singleton, then renders the form. */
export function SettingsForm() {
  const { data, isLoading, isError, error, refetch } = useSettings();

  if (isError || (!data && !isLoading)) {
    return (
      <ErrorState
        title="Couldn’t load settings"
        description={errorMessage(error)}
        onRetry={() => void refetch()}
      />
    );
  }
  if (isLoading || !data) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton variant="rounded" className="h-44 w-full" />
        <Skeleton variant="rounded" className="h-44 w-full" />
      </div>
    );
  }
  return <SettingsFormFields settings={data} />;
}
