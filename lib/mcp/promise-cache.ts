export function createRetryablePromiseCache<Key extends PropertyKey, Value>(
  builder: (key: Key) => Promise<Value>,
): (key: Key) => Promise<Value> {
  const cache: Partial<Record<Key, Promise<Value>>> = {};

  return (key) => {
    const cached = cache[key];
    if (cached) return cached;

    const promise = Promise.resolve()
      .then(() => builder(key))
      .catch((error) => {
        if (cache[key] === promise) delete cache[key];
        throw error;
      });
    cache[key] = promise;
    return promise;
  };
}
