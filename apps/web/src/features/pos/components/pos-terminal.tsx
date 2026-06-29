'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  toast,
} from '@stockflow/ui';
import {
  PAYMENT_METHODS,
  type CreateSaleRequest,
  type PaymentMethod,
  type SaleResponse,
} from '@stockflow/types';
import { errorMessage } from '@/lib/api';
import { formatMinorToMajor, parseMajorToMinor } from '@/lib/money';
import { WAREHOUSES } from '@/features/locations/descriptors';
import { useActiveResources } from '@/features/resources/queries';
import { LocationSelect } from '@/features/locations/components/location-select';
import { useProducts, useVariants } from '@/features/products/queries';
import { useHasPermission } from '@/features/auth/use-session';
import { useCreateSale } from '../use-pos';

interface CartLine {
  variantId: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
}

const PAYMENT_LABELS: Record<PaymentMethod, string> = { cash: 'Cash', card: 'Card', other: 'Other' };

export function PosTerminal() {
  const canSell = useHasPermission('pos.sell');
  const createSale = useCreateSale();

  const [warehouseId, setWarehouseId] = useState('');
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tendered, setTendered] = useState('');
  const [receipt, setReceipt] = useState<SaleResponse | null>(null);

  const stores = (useActiveResources(WAREHOUSES).data?.data ?? []).filter((site) => site.type === 'store');
  const products = useProducts({ page: 1, limit: 100, sort: 'name' });
  const variants = useVariants(productId || undefined);

  const subtotalMinor = cart.reduce((sum, line) => sum + line.quantity * line.unitPriceMinor, 0);
  const tenderedMinor = parseMajorToMinor(tendered) ?? 0;
  const changeMinor = Math.max(0, tenderedMinor - subtotalMinor);
  const money = (minor: number): string => `${currency} ${formatMinorToMajor(minor)}`;

  const addVariant = (variantId: string): void => {
    const variant = (variants.data ?? []).find((v) => v.id === variantId);
    if (!variant) return;
    setCurrency(variant.currency ?? currency);
    setCart((prev) => {
      const existing = prev.find((line) => line.variantId === variantId);
      if (existing) {
        return prev.map((line) =>
          line.variantId === variantId ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [...prev, { variantId, sku: variant.sku, quantity: 1, unitPriceMinor: variant.defaultPriceMinor ?? 0 }];
    });
  };

  const patchLine = (variantId: string, patch: Partial<CartLine>): void => {
    setCart((prev) => prev.map((line) => (line.variantId === variantId ? { ...line, ...patch } : line)));
  };
  const removeLine = (variantId: string): void => {
    setCart((prev) => prev.filter((line) => line.variantId !== variantId));
  };

  const reset = (): void => {
    setCart([]);
    setTendered('');
    setProductId('');
  };

  const complete = async (): Promise<void> => {
    if (!locationId) {
      toast.error('Choose a store location to sell from.');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add at least one item.');
      return;
    }
    if (tenderedMinor < subtotalMinor) {
      toast.error('Amount tendered is less than the total due.');
      return;
    }
    const body: CreateSaleRequest = {
      locationId,
      currency,
      lines: cart.map((line) => ({
        variantId: line.variantId,
        quantity: line.quantity,
        unitPriceMinor: line.unitPriceMinor,
      })),
      paymentMethod,
      amountTenderedMinor: tenderedMinor,
    };
    try {
      const sale = await createSale.mutateAsync(body);
      setReceipt(sale);
      reset();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (receipt) {
    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Sale complete
            <Badge tone="success" appearance="soft">
              {receipt.receiptNumber}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span>{receipt.lines.reduce((sum, line) => sum + line.quantity, 0)}</span>
          </div>
          <div className="flex justify-between font-medium">
            <span>Total</span>
            <span>{`${receipt.currency} ${formatMinorToMajor(receipt.totalMinor)}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Paid ({PAYMENT_LABELS[receipt.paymentMethod]})</span>
            <span>{`${receipt.currency} ${formatMinorToMajor(receipt.amountTenderedMinor)}`}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Change</span>
            <span>{`${receipt.currency} ${formatMinorToMajor(receipt.changeMinor)}`}</span>
          </div>
          <Button className="mt-2 w-full" onClick={() => setReceipt(null)}>
            New sale
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Point of Sale</h1>
        <p className="text-sm text-muted-foreground">Ring up a sale at one of your stores.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: store, location, item picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Store">
                <Select
                  value={warehouseId}
                  onValueChange={(next) => {
                    setWarehouseId(next);
                    setLocationId('');
                  }}
                >
                  <SelectTrigger placeholder={stores.length ? 'Select a store' : 'No stores yet'} />
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Location">
                <LocationSelect
                  warehouseId={warehouseId}
                  value={locationId}
                  onChange={setLocationId}
                  placeholder="Select a location"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product">
                <Select
                  value={productId}
                  onValueChange={(next) => setProductId(next)}
                  disabled={products.isLoading}
                >
                  <SelectTrigger placeholder="Pick a product" />
                  <SelectContent>
                    {(products.data?.data ?? []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Add item">
                <Select
                  value=""
                  onValueChange={addVariant}
                  disabled={!productId || variants.isLoading}
                >
                  <SelectTrigger placeholder={productId ? 'Add a variant' : 'Pick a product first'} />
                  <SelectContent>
                    {(variants.data ?? []).map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.sku}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {cart.length === 0 ? (
              <p className="rounded-md border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No items yet. Pick a product and add a variant.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {cart.map((line) => (
                  <li key={line.variantId} className="flex items-center gap-3 py-3">
                    <span className="min-w-0 flex-1 truncate font-mono text-xs">{line.sku}</span>
                    <Input
                      type="number"
                      min={1}
                      value={String(line.quantity)}
                      onChange={(event) =>
                        patchLine(line.variantId, { quantity: Math.max(1, Number(event.target.value) || 1) })
                      }
                      className="w-16"
                      aria-label={`Quantity for ${line.sku}`}
                    />
                    <Input
                      value={formatMinorToMajor(line.unitPriceMinor)}
                      onChange={(event) =>
                        patchLine(line.variantId, { unitPriceMinor: parseMajorToMinor(event.target.value) ?? 0 })
                      }
                      className="w-24"
                      aria-label={`Unit price for ${line.sku}`}
                    />
                    <span className="w-24 text-right text-sm tabular-nums">
                      {money(line.quantity * line.unitPriceMinor)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => removeLine(line.variantId)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right: payment + checkout */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Payment</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{money(subtotalMinor)}</span>
            </div>
            <Field label="Method">
              <Select value={paymentMethod} onValueChange={(next) => setPaymentMethod(next as PaymentMethod)}>
                <SelectTrigger aria-label="Payment method" />
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Amount tendered">
              <Input
                inputMode="decimal"
                placeholder="0.00"
                value={tendered}
                onChange={(event) => setTendered(event.target.value)}
              />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Change</span>
              <span className="tabular-nums">{money(changeMinor)}</span>
            </div>
            <Button
              className="w-full"
              onClick={() => void complete()}
              loading={createSale.isPending}
              loadingText="Completing…"
              disabled={!canSell || cart.length === 0 || !locationId}
            >
              {canSell ? 'Complete sale' : 'No permission to sell'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
