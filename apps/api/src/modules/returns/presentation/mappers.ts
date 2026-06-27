import type { ReturnResponse, ReturnSummary } from '@stockflow/types';
import type { ReturnEntity, ReturnLine } from '../domain/entities';

function lineResponse(line: ReturnLine) {
  return {
    id: line.id,
    variantId: line.variantId,
    skuSnapshot: line.skuSnapshot,
    nameSnapshot: line.nameSnapshot,
    quantity: line.quantity,
  };
}

function base(ret: ReturnEntity) {
  return {
    id: ret.id,
    returnNumber: ret.returnNumber,
    kind: ret.kind,
    partyId: ret.partyId,
    partyName: ret.partyName,
    locationId: ret.locationId,
    status: ret.status,
    reason: ret.reason,
    createdAt: ret.createdAt.toISOString(),
    updatedAt: ret.updatedAt.toISOString(),
  };
}

/** Detail — full return with embedded lines + note. */
export function toReturnResponse(ret: ReturnEntity): ReturnResponse {
  return { ...base(ret), note: ret.note, lines: ret.lines.map(lineResponse) };
}

/** List item — omits lines; carries `lineCount`. */
export function toReturnSummary(ret: ReturnEntity): ReturnSummary {
  return { ...base(ret), lineCount: ret.lines.length };
}
