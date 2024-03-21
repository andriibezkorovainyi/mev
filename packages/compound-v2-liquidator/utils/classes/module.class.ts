import type { ICompoundV2LiquidatorModule } from '../interfaces/master-module.interface.ts';
import type { ServiceMapping } from '../interfaces/service-mapping.interface.ts';

export class Module implements ICompoundV2LiquidatorModule {
  private services: Partial<ServiceMapping> = {};

  private imports: Partial<ServiceMapping> = {};

  // constructor(...serviceIdentifiers: ServiceIdentifier[]) {
  //   this.initializeServices(serviceIdentifiers);
  // }

  registerService<K extends keyof ServiceMapping>(
    serviceName: K,
    service: ServiceMapping[K],
  ): void {
    this.services[serviceName] = service;
  }

  getService<K extends keyof ServiceMapping>(
    serviceName: K,
  ): ServiceMapping[K] {
    const service = this.services[serviceName];
    if (!service) throw new Error(`Service ${serviceName} not found`);
    return service as ServiceMapping[K];
  }

  // private initializeServices(
  //   serviceIdentifiers: Array<keyof ServiceMapping>,
  // ): void {
  //   serviceIdentifiers.forEach((serviceIdentifier) => {
  //     try {
  //       const service = this.getService(
  //         serviceIdentifier as keyof ServiceMapping,
  //       );
  //
  //       this.imports[serviceIdentifier] = service;
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   });
  // }
}
