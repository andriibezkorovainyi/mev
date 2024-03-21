import type { ServiceMapping } from 'compound-v2-liquidator/utils/interfaces/service-mapping.interface.ts';

export interface IModule {
  registerService<K extends keyof ServiceMapping>(
    serviceName: K,
    service: ServiceMapping[K],
  ): void;

  getService<T extends keyof ServiceMapping>(
    serviceName: any,
  ): ServiceMapping[T];
}
