import type { StockLevelResponse, StockMovementResponse } from '@stockflow/types';
import type { StockLevelEntity, StockMovementEntity } from '../domain/entities';

/** Domain → response mappers; no entity/Mongoose leakage to clients. */
export function toStockMovementResponse(entity: StockMovementEntity): StockMovementResponse {
  return {
    id: entity.id,
    variantId: entity.variantId,
    locationId: entity.locationId,
    delta: entity.delta,
    type: entity.type,
    reason: { kind: entity.reason.kind, refId: entity.reason.refId, lineId: entity.reason.lineId },
    unitCostMinor: entity.unitCostMinor,
    currency: entity.currency,
    note: entity.note,
    opKey: entity.opKey,
    createdAt: entity.createdAt.toISOString(),
    createdBy: entity.createdBy,
  };
}

export function toStockLevelResponse(entity: StockLevelEntity): StockLevelResponse {
  return {
    variantId: entity.variantId,
    locationId: entity.locationId,
    onHand: entity.onHand,
    reserved: entity.reserved,
    available: entity.available,
    inTransit: entity.inTransit,
    avgCostMinor: entity.avgCostMinor,
    currency: entity.currency,
    lastMovementAt: entity.lastMovementAt ? entity.lastMovementAt.toISOString() : null,
    updatedAt: entity.updatedAt.toISOString(),
  };
}
