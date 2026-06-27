export type { ResourceEntity, ResourceStatus, ResourceAction, ResourceEvent } from './resource.entity';
export {
  type ResourceRepository,
  type ResourceIdGenerator,
  type ResourceClock,
  type ResourceEventPublisher,
} from './resource.ports';
export { ResourceService, type ListResult } from './resource.service';
export { InMemoryResourceRepository } from './in-memory.resource.repository';
export {
  ObjectIdGenerator,
  SystemClock,
  LoggingResourceEventPublisher,
} from './adapters';
export { ResourceNotFoundError, DuplicateResourceError } from './resource.errors';
export { normalizeName, nameKey } from './name';
