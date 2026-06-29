import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { OrganizationSettingsEntity } from '../../domain/entities';
import type { OrganizationSettingsRepository } from '../../application/ports';
import { ORGANIZATION_SETTINGS_MODEL, type OrganizationSettingsDoc } from './schemas';

// ─── Mappers (entity ⇄ document; the tenant identity lives in `_id`) ──────────────
function toEntity(doc: OrganizationSettingsDoc): OrganizationSettingsEntity {
  return {
    organizationId: doc._id,
    defaultCurrency: doc.defaultCurrency,
    timezone: doc.timezone,
    allowNegativeStock: doc.allowNegativeStock,
    lowStockAlertsEnabled: doc.lowStockAlertsEnabled,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    updatedBy: doc.updatedBy,
  };
}

/** The mutable fields (everything but the `_id`/`organizationId` identity) — the `$set` payload on upsert. */
function toSet(entity: OrganizationSettingsEntity): Omit<OrganizationSettingsDoc, '_id'> {
  const { organizationId: _ignore, ...rest } = entity;
  return rest;
}

/**
 * Mongoose adapter for the organization-settings singleton — implements the same `OrganizationSettingsRepository`
 * port as the in-memory store, so the application is untouched. One document per tenant, upserted by `_id`
 * (= organizationId).
 */
@Injectable()
export class MongoOrganizationSettingsRepository implements OrganizationSettingsRepository {
  constructor(
    @InjectModel(ORGANIZATION_SETTINGS_MODEL) private readonly model: Model<OrganizationSettingsDoc>,
  ) {}

  async findByOrg(organizationId: string): Promise<OrganizationSettingsEntity | null> {
    const doc = await this.model.findById(organizationId).lean<OrganizationSettingsDoc>().exec();
    return doc ? toEntity(doc) : null;
  }

  async upsert(settings: OrganizationSettingsEntity): Promise<OrganizationSettingsEntity> {
    const doc = await this.model
      .findByIdAndUpdate(
        settings.organizationId,
        { $set: toSet(settings) },
        { upsert: true, returnDocument: 'after' },
      )
      .lean<OrganizationSettingsDoc>()
      .exec();
    return doc ? toEntity(doc) : { ...settings };
  }
}
