type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  createdAt: number;
  hits: number;
};

type CacheKey = string;
type Tags = Set<string>;

interface CacheConfig {
  defaultTtlMs: number;
  maxEntries: number;
  cleanupIntervalMs: number;
}

export class Cache {
  private store = new Map<CacheKey, CacheEntry<unknown>>();
  private keyTags = new Map<CacheKey, Tags>();
  private tagKeys = new Map<string, Set<CacheKey>>();
  private config: CacheConfig;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private hits = 0;
  private misses = 0;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTtlMs: 60_000,
      maxEntries: 1000,
      cleanupIntervalMs: 30_000,
      ...config,
    };
    this.startCleanup();
  }

  get<T>(key: CacheKey): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }
    entry.hits++;
    this.hits++;
    return entry.value as T;
  }

  set<T>(key: CacheKey, value: T, ttlMs?: number, tags?: string[]): void {
    if (this.store.size >= this.config.maxEntries) {
      this.evict();
    }
    const entry: CacheEntry<T> = {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.config.defaultTtlMs),
      createdAt: Date.now(),
      hits: 0,
    };
    this.store.set(key, entry);

    if (tags?.length) {
      const tagSet = new Set(tags);
      this.keyTags.set(key, tagSet);
      for (const tag of tags) {
        let keys = this.tagKeys.get(tag);
        if (!keys) {
          keys = new Set();
          this.tagKeys.set(tag, keys);
        }
        keys.add(key);
      }
    }
  }

  delete(key: CacheKey): void {
    this.store.delete(key);
    const tags = this.keyTags.get(key);
    if (tags) {
      for (const tag of tags) {
        this.tagKeys.get(tag)?.delete(key);
      }
      this.keyTags.delete(key);
    }
  }

  invalidateTag(tag: string): void {
    const keys = this.tagKeys.get(tag);
    if (!keys) return;
    for (const key of keys) {
      this.store.delete(key);
      this.keyTags.delete(key);
    }
    this.tagKeys.delete(tag);
  }

  clear(): void {
    this.store.clear();
    this.keyTags.clear();
    this.tagKeys.clear();
  }

  getStats() {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 ? this.hits / (this.hits + this.misses) : 0,
      maxEntries: this.config.maxEntries,
    };
  }

  private evict(): void {
    const entries = [...this.store.entries()]
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => a.entry.hits - b.entry.hits || a.entry.createdAt - b.entry.createdAt);
    const toRemove = Math.ceil(this.config.maxEntries * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.delete(entries[i].key);
    }
  }

  private startCleanup(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now > entry.expiresAt) {
          this.delete(key);
        }
      }
    }, this.config.cleanupIntervalMs);
    if (this.cleanupTimer && typeof this.cleanupTimer === "object" && "unref" in this.cleanupTimer) {
      (this.cleanupTimer as NodeJS.Timeout).unref();
    }
  }

  destroy(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
    this.clear();
  }
}

export const globalCache = new Cache({ defaultTtlMs: 60_000, maxEntries: 2000 });
