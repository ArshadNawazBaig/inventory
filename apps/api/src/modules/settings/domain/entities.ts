/**
 * Settings domain entity (organization singleton). One document per tenant; the `organizationId` is its
 * identity. Framework-free. Timestamps are null until the tenant first saves (a GET returns ephemeral
 * defaults without persisting).
 */
export interface OrganizationSettingsEntity {
  organizationId: string;
  defaultCurrency: string;
  timezone: string;
  allowNegativeStock: boolean;
  lowStockAlertsEnabled: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  updatedBy: string | null;
}
