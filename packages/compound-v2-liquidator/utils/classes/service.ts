import Env from '../constants/env.ts';
import type { IService } from '../../../../common/interfaces/service.interface.ts';

// @ts-ignore
export class Service implements Partial<IService> {
  public env = Env;

  constructor() {}
}
