import type { TransferResponse, TransferSummary } from '@stockflow/types';
import type { TransferEntity, TransferLine } from '../domain/entities';

function lineResponse(line: TransferLine) {
  return {
    id: line.id,
    variantId: line.variantId,
    skuSnapshot: line.skuSnapshot,
    nameSnapshot: line.nameSnapshot,
    quantity: line.quantity,
    dispatchedQty: line.dispatchedQty,
    receivedQty: line.receivedQty,
    unitCostMinor: line.unitCostMinor,
  };
}

function base(transfer: TransferEntity) {
  return {
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    sourceLocationId: transfer.sourceLocationId,
    sourceLocationName: transfer.sourceLocationName,
    destinationLocationId: transfer.destinationLocationId,
    destinationLocationName: transfer.destinationLocationName,
    status: transfer.status,
    createdAt: transfer.createdAt.toISOString(),
    updatedAt: transfer.updatedAt.toISOString(),
  };
}

/** Detail — full transfer with embedded lines + note. */
export function toTransferResponse(transfer: TransferEntity): TransferResponse {
  return { ...base(transfer), note: transfer.note, lines: transfer.lines.map(lineResponse) };
}

/** List item — omits lines; carries `lineCount`. */
export function toTransferSummary(transfer: TransferEntity): TransferSummary {
  return { ...base(transfer), lineCount: transfer.lines.length };
}
