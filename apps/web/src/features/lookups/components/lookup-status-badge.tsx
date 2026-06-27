import { Badge, type BadgeTone } from '@stockflow/ui';
import type { LookupStatus } from '@stockflow/types';

const TONE: Record<LookupStatus, BadgeTone> = { active: 'success', archived: 'neutral' };
const LABEL: Record<LookupStatus, string> = { active: 'Active', archived: 'Archived' };

/** Status of a catalog lookup (colour is a redundant cue; meaning is in the text). */
export function LookupStatusBadge({ status }: { status: LookupStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LABEL[status]}
    </Badge>
  );
}
