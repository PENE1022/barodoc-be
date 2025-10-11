import { Injectable } from '@nestjs/common';
import { Ticket, TS } from './dto';

type Key = string; // `${hospitalId}:${counterId}`
const k = (h: string, c: string) => `${h}:${c}`;

@Injectable()
export class QueueService {
  private seq = new Map<Key, number>();
  private waiting = new Map<Key, Ticket[]>();
  private byId = new Map<string, Ticket>();

  issue(hospitalId: string, counterId: string): Ticket {
    const key = k(hospitalId, counterId);
    const next = (this.seq.get(key) ?? 0) + 1;
    this.seq.set(key, next);

    const t: Ticket = {
      id: `T${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      hospitalId, counterId,
      number: next,
      status: TS.WAITING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const q = this.waiting.get(key) ?? [];
    q.push(t);
    this.waiting.set(key, q);
    this.byId.set(t.id, t);
    return t;
  }

  callNext(hospitalId: string, counterId: string): Ticket | null {
    const key = k(hospitalId, counterId);
    const q = this.waiting.get(key) ?? [];
    const next = q.shift();
    if (!next) return null;

    next.status = TS.CALLED;
    next.updatedAt = Date.now();

    this.waiting.set(key, q);
    this.byId.set(next.id, next);
    return next;
  }

  snapshot(hospitalId: string) {
    const counters: Record<string, { last: number; waiting: Ticket[] }> = {};
    for (const [key, last] of this.seq.entries()) {
      const [h, c] = key.split(':');
      if (h !== hospitalId) continue;
      counters[c] = counters[c] ?? { last: 0, waiting: [] };
      counters[c].last = last;
      counters[c].waiting = this.waiting.get(key) ?? [];
    }
    return { hospitalId, counters };
  }
}
