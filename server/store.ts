// Conversation state. Vercel functions keep nothing between invocations, so
// production uses Upstash Redis over its REST API (plain fetch, no client
// library). MemoryStore serves local dry runs and tests.

export interface Store {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
  /** Atomic claim: true only for the first caller (dedupe, unique refs). */
  setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean>;
  del(key: string): Promise<void>;
}

export class MemoryStore implements Store {
  private data = new Map<string, { value: string; expires: number }>();
  private now: () => number;
  constructor(now: () => number = Date.now) {
    this.now = now;
  }

  private live(key: string) {
    const hit = this.data.get(key);
    if (hit && hit.expires <= this.now()) this.data.delete(key);
    return this.data.get(key);
  }
  async get<T>(key: string): Promise<T | null> {
    const hit = this.live(key);
    return hit ? (JSON.parse(hit.value) as T) : null;
  }
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.data.set(key, { value: JSON.stringify(value), expires: this.now() + ttlSeconds * 1000 });
  }
  async setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    if (this.live(key)) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }
  async del(key: string): Promise<void> {
    this.data.delete(key);
  }
}

export class UpstashStore implements Store {
  private url: string;
  private token: string;
  private prefix: string;
  constructor(url: string, token: string, prefix = 'farsan:') {
    this.url = url;
    this.token = token;
    this.prefix = prefix;
  }

  private async command(args: (string | number)[]): Promise<unknown> {
    const res = await fetch(this.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(args),
    });
    const body = (await res.json().catch(() => ({}))) as { result?: unknown; error?: string };
    if (!res.ok || body.error) throw new Error(`redis ${args[0]}: ${res.status} ${body.error ?? ''}`.trim());
    return body.result;
  }
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.command(['GET', this.prefix + key]);
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : null;
  }
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.command(['SET', this.prefix + key, JSON.stringify(value), 'EX', ttlSeconds]);
  }
  async setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    return (await this.command(['SET', this.prefix + key, JSON.stringify(value), 'EX', ttlSeconds, 'NX'])) === 'OK';
  }
  async del(key: string): Promise<void> {
    await this.command(['DEL', this.prefix + key]);
  }
}
