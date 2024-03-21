import type { IService } from '../../../../common/interfaces/service.interface.ts';
import Redis from 'ioredis';
import { addRetries } from '../../../../common/helpers/addRetries.ts';

export class CacheService implements IService {
  private redis = new Redis();

  constructor() {}

  init() {}

  async set(key: string, value: any) {
    function replacer(key, value) {
      if (value instanceof Map) {
        return Array.from(value);
      }

      if (typeof value === 'bigint') {
        return value + 'n';
      }

      if (value instanceof Set) {
        return Array.from(value);
      }

      return value;
    }

    await this.redis.set(key, JSON.stringify(value, replacer, 2));
  }

  async get(key: string) {
    function reviver(key, value) {
      if (Array.isArray(value) && Array.isArray(value[0])) {
        return new Map(value);
      }

      // Обработка BigInt, включая отрицательные значения
      if (typeof value === 'string') {
        const bigintMatch = value.match(/^(-?\d+)n$/);
        if (bigintMatch) {
          return BigInt(bigintMatch[1]);
        }
      }

      if (key === 'allMarkets' || key === 'accounts') {
        return new Set(value);
      }

      return value;
    }

    const method = this.redis.get.bind(this.redis);
    const value = await addRetries(method, key);
    return JSON.parse(value, reviver);
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
}
