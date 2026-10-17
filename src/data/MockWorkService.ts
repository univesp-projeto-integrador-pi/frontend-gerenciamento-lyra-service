import { LocalRecordService } from './LocalRecordService';
import type { WorkService } from './WorkService';
import type { Work } from './models';
import { isWork } from './validation';
export class MockWorkService extends LocalRecordService<Work> implements WorkService {
  constructor() { super('cleanpro.works', isWork); }
}
