import type { IService } from '../../../../common/interfaces/service.interface.ts';
import Redis from 'ioredis';
import { addRetries } from '../../../../common/helpers/addRetries.ts';
import replacer from '../../../../common/helpers/replacer.ts';
import Env from '../../utils/constants/env.ts';
import { reviver } from '../../../../common/helpers/reviver.ts';
import { delay } from '../../../../common/helpers/delay.ts';

export class CacheService implements IService {
  private redis = new Redis();
  private readonly prefix = [
    `${Env.NETWORK}`,
    `${Env.NETWORK_NAME}`,
    `${Env.PROTOCOL}`,
  ].join(':');

  constructor() {}

  init() {}

  async set(key: string, value: any) {
    const normalizedKey = `${this.prefix}:${key}`;
    await this.redis.set(normalizedKey, JSON.stringify(value, replacer, 2));
  }

  async get(key: string) {
    const normalizedKey = `${this.prefix}:${key}`;
    const method = this.redis.get.bind(this.redis);
    const value = await addRetries(method, normalizedKey);
    return JSON.parse(value, reviver);
  }

  async setEntries(entries: [string, any][]) {
    const pipeline = this.redis.pipeline();

    entries.forEach(([key, value]) => {
      const normalizedKey = `${this.prefix}:${key}`;
      pipeline.set(normalizedKey, JSON.stringify(value, replacer, 2));
    });

    try {
      const result = await pipeline.exec();

      if (!result || result.some(([error]) => error)) {
        throw new Error('Failed to set entries.\n' + JSON.stringify(result));
      }
    } catch (error) {
      console.error(error);
      await delay(1000);
      await this.setEntries(entries);
    }
  }

  async getValues(keys: string[]) {
    console.debug('method -> cacheService.getValues');

    const pipeline = this.redis.pipeline();

    for (const key of keys) {
      pipeline.get(key);
    }

    let values: any[] = [];

    await pipeline.exec((err, results) => {
      if (err) {
        console.error(err);
        return;
      }

      if (!results) {
        return {};
      }

      values = results.map(([error, value]) => {
        return error || !value ? undefined : JSON.parse(value as string);
      });
    });

    return values;
  }

  async delete(key: string) {
    const normalizedKey = `${this.prefix}:${key}`;
    await this.redis.del(normalizedKey);
  }

  async cacheClear() {
    await this.delete('accounts');
    await this.delete('markets');
    await this.delete('comptroller');
    await this.delete('pointerHeight');
    await this.delete('tokenConfigs');
  }
}
