# Project Overview

> **Status:** 🟡 Seed · **Owner:** Product/CTO · **Related:** [vision](./vision.md) · [roadmap](./roadmap.md) · [PRD](../../docs/PRODUCT_REQUIREMENTS.md)

## Purpose
One-screen orientation for anyone (human or AI) joining the project.

## What we're building
**StockFlow** — a modern, multi-tenant **Inventory Management SaaS** for the mid-market: the
correctness and control of an enterprise ERP with the speed and polish of Linear/Notion.

## The wedge
The gap between spreadsheets/lightweight tools (Sortly, inFlow) and heavyweight ERPs
(NetSuite, SAP B1). Our edge: **enterprise-grade correctness with consumer-grade UX.**

## What makes it correct
- Immutable **stock ledger** is the source of truth; on-hand is a projection.
- Multi-dimensional stock: *variant × location × lot/serial × status*.
- Audit logs, RBAC, and tenant isolation from day one.

## Primary domains
Catalog · Inventory Core · Locations · Procurement · Sales/Outbound · Reporting · Platform/Admin.

## Tech at a glance
Next.js + NestJS + MongoDB + Redis/BullMQ, Cloudinary, Better Auth, Stripe. See
[CLAUDE.md §4](../CLAUDE.md).

## Where to go next
- The "why" → [vision.md](./vision.md)
- The "when" → [roadmap.md](./roadmap.md)
- The "what exactly" → [PRD](../../docs/PRODUCT_REQUIREMENTS.md)
