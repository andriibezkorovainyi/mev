import { delay } from './delay.ts';

export const addRetries = async (
  someFunction: Function,
  ...args: unknown[]
) => {
  // console.log('args', args);
  for (let retries = 10; retries > 0; retries--) {
    try {
      return await someFunction(...args.filter(Boolean));
    } catch (e) {
      console.error(e, `arguments: ${args.join(', ')}`);
      console.warn(`retrying function -> ${someFunction.name}`);
      await delay();
    }
  }
  return null;
};
