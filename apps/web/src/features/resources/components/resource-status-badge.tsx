import { Badge, type BadgeTone } from '@stockflow/ui';
import type { ResourceStatus } from '../types';

const TONE: Record<ResourceStatus, BadgeTone> = { active: 'success', archived: 'neutral' };
const LABEL: Record<ResourceStatus, string> = { active: 'Active', archived: 'Archived' };

/** Status of a managed resource (colour is a redundant cue; meaning is in the text). */
export function ResourceStatusBadge({ status }: { status: ResourceStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {LABEL[status]}
    </Badge>
  );
}
