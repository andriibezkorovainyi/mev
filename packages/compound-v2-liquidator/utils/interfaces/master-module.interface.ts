import type { IModule } from '../../../../common/interfaces/module.interface.ts';
import type { ServiceMapping } from './service-mapping.interface.ts';

export interface ICompoundV2LiquidatorModule extends IModule {
  getService<K extends keyof ServiceMapping>(serviceName: K): ServiceMapping[K];
}
