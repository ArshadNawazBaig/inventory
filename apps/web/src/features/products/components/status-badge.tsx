import { Badge, type BadgeTone } from '@stockflow/ui';
import type { ProductStatus, VariantStatus } from '@stockflow/types';

const PRODUCT_TONE: Record<ProductStatus, BadgeTone> = {
  draft: 'neutral',
  active: 'success',
  archived: 'warning',
};

const PRODUCT_LABEL: Record<ProductStatus, string> = {
  draft: 'Draft',
  active: 'Active',
  archived: 'Archived',
};

/** Lifecycle status of a product, colour-coded (meaning lives in the text; colour is a redundant cue). */
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge tone={PRODUCT_TONE[status]} dot>
      {PRODUCT_LABEL[status]}
    </Badge>
  );
}

const VARIANT_TONE: Record<VariantStatus, BadgeTone> = {
  active: 'success',
  archived: 'neutral',
};

const VARIANT_LABEL: Record<VariantStatus, string> = {
  active: 'Active',
  archived: 'Archived',
};

/** Status of a single variant (a variant may be retired independently of its product). */
export function VariantStatusBadge({ status }: { status: VariantStatus }) {
  return (
    <Badge tone={VARIANT_TONE[status]} size="sm">
      {VARIANT_LABEL[status]}
    </Badge>
  );
}
