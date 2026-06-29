import { Injectable } from '@nestjs/common';
import type { SystemRoleId } from '@stockflow/types';
import type {
  InvitationEntity,
  MembershipEntity,
  OrganizationEntity,
  SessionEntity,
  UserEntity,
} from '../domain/entities';
import type {
  InvitationRepository,
  MembershipRepository,
  OrganizationRepository,
  SessionRepository,
  UserRepository,
} from '../application/ports';

/**
 * In-memory auth stores — the runnable, fully-testable persistence (the default driver). Each mirrors its port
 * exactly; the Mongoose adapters drop in unchanged behind the `PERSISTENCE_DRIVER` switch. Entities are cloned
 * on the way in and out so callers can't mutate stored state by reference.
 */

@Injectable()
export class InMemoryOrganizationRepository implements OrganizationRepository {
  private readonly store = new Map<string, OrganizationEntity>();

  insert(organization: OrganizationEntity): Promise<OrganizationEntity> {
    this.store.set(organization.id, { ...organization });
    return Promise.resolve({ ...organization });
  }

  findById(id: string): Promise<OrganizationEntity | null> {
    const found = this.store.get(id);
    return Promise.resolve(found ? { ...found } : null);
  }
}

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private readonly store = new Map<string, UserEntity>();

  insert(user: UserEntity): Promise<UserEntity> {
    this.store.set(user.id, { ...user });
    return Promise.resolve({ ...user });
  }

  findById(id: string): Promise<UserEntity | null> {
    const found = this.store.get(id);
    return Promise.resolve(found ? { ...found } : null);
  }

  findByEmail(email: string): Promise<UserEntity | null> {
    const found = [...this.store.values()].find((u) => u.email === email);
    return Promise.resolve(found ? { ...found } : null);
  }
}

@Injectable()
export class InMemoryMembershipRepository implements MembershipRepository {
  private readonly store = new Map<string, MembershipEntity>();

  insert(membership: MembershipEntity): Promise<MembershipEntity> {
    this.store.set(membership.id, this.clone(membership));
    return Promise.resolve(this.clone(membership));
  }

  findById(organizationId: string, id: string): Promise<MembershipEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    return Promise.resolve(this.clone(found));
  }

  findByUserAndOrg(organizationId: string, userId: string): Promise<MembershipEntity | null> {
    const found = [...this.store.values()].find(
      (m) => m.organizationId === organizationId && m.userId === userId,
    );
    return Promise.resolve(found ? this.clone(found) : null);
  }

  listByUser(userId: string): Promise<MembershipEntity[]> {
    const items = [...this.store.values()]
      .filter((m) => m.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.resolve(items.map((m) => this.clone(m)));
  }

  listByOrg(organizationId: string): Promise<MembershipEntity[]> {
    const items = [...this.store.values()]
      .filter((m) => m.organizationId === organizationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.resolve(items.map((m) => this.clone(m)));
  }

  countByRole(organizationId: string, roleId: SystemRoleId): Promise<number> {
    const count = [...this.store.values()].filter(
      (m) => m.organizationId === organizationId && m.roleIds.includes(roleId),
    ).length;
    return Promise.resolve(count);
  }

  update(
    organizationId: string,
    id: string,
    patch: Partial<MembershipEntity>,
  ): Promise<MembershipEntity | null> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(null);
    const next: MembershipEntity = { ...found, ...patch, roleIds: [...(patch.roleIds ?? found.roleIds)] };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  delete(organizationId: string, id: string): Promise<boolean> {
    const found = this.store.get(id);
    if (!found || found.organizationId !== organizationId) return Promise.resolve(false);
    this.store.delete(id);
    return Promise.resolve(true);
  }

  private clone(membership: MembershipEntity): MembershipEntity {
    return { ...membership, roleIds: [...membership.roleIds] };
  }
}

@Injectable()
export class InMemorySessionRepository implements SessionRepository {
  private readonly store = new Map<string, SessionEntity>();

  insert(session: SessionEntity): Promise<SessionEntity> {
    this.store.set(session.id, { ...session });
    return Promise.resolve({ ...session });
  }

  findById(id: string): Promise<SessionEntity | null> {
    const found = this.store.get(id);
    return Promise.resolve(found ? { ...found } : null);
  }

  delete(id: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(id));
  }

  deleteByUser(userId: string): Promise<number> {
    let removed = 0;
    for (const [id, session] of this.store) {
      if (session.userId === userId) {
        this.store.delete(id);
        removed += 1;
      }
    }
    return Promise.resolve(removed);
  }
}

@Injectable()
export class InMemoryInvitationRepository implements InvitationRepository {
  private readonly store = new Map<string, InvitationEntity>();

  insert(invitation: InvitationEntity): Promise<InvitationEntity> {
    this.store.set(invitation.id, this.clone(invitation));
    return Promise.resolve(this.clone(invitation));
  }

  findByTokenHash(tokenHash: string): Promise<InvitationEntity | null> {
    const found = [...this.store.values()].find((i) => i.tokenHash === tokenHash);
    return Promise.resolve(found ? this.clone(found) : null);
  }

  findPendingByOrgAndEmail(organizationId: string, email: string): Promise<InvitationEntity | null> {
    const found = [...this.store.values()].find(
      (i) => i.organizationId === organizationId && i.email === email && i.status === 'pending',
    );
    return Promise.resolve(found ? this.clone(found) : null);
  }

  listPendingByOrg(organizationId: string): Promise<InvitationEntity[]> {
    const items = [...this.store.values()]
      .filter((i) => i.organizationId === organizationId && i.status === 'pending')
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.resolve(items.map((i) => this.clone(i)));
  }

  update(id: string, patch: Partial<InvitationEntity>): Promise<InvitationEntity | null> {
    const found = this.store.get(id);
    if (!found) return Promise.resolve(null);
    const next: InvitationEntity = { ...found, ...patch, roleIds: [...(patch.roleIds ?? found.roleIds)] };
    this.store.set(id, next);
    return Promise.resolve(this.clone(next));
  }

  private clone(invitation: InvitationEntity): InvitationEntity {
    return { ...invitation, roleIds: [...invitation.roleIds] };
  }
}
