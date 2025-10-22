import { Injectable } from '@nestjs/common';
import { Ticket, TS } from './dto';

type Key = string; // `${hospitalId}:${counterId}`
const k = (h: string, c: string) => `${h}:${c}`;

// 1인당 5분
const SERVICE_TIME_SEC = 300;

@Injectable()
export class QueueService {
  private seq = new Map<Key, number>();
  private waiting = new Map<Key, Ticket[]>();
  private byId = new Map<string, Ticket>();

  /** 번호표 발급 */
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

  /**
   * 기존 방식: 선두를 호출만 함(ETA 계산/방송은 컨트롤러 등에서 별도 처리)
   */
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

  /**
   * 차감 규칙 버전: 선두 호출 + “뒤의 ETA = 기존 ETA - 선두 ETA(0 하한)”
   * - 반환: 호출된 티켓과 차감 후의 ETA 목록(초)
   */
  callNextWithSubtraction(hospitalId: string, counterId: string): {
    called: Ticket | null;
    items: Array<{ id: string; number: number; etaSec: number }>;
    updatedAt: number;
  } {
    const key = k(hospitalId, counterId);
    const q = this.waiting.get(key) ?? [];
    const now = Date.now();

    if (q.length === 0) {
      return { called: null, items: [], updatedAt: now };
    }

    // 호출 직전의 ETA 스냅샷(선두 포함)
    const prevEtas = q.map((_, idx) => this.etaOfIndex(q, idx, now)); // [A_eta, B_eta, C_eta...]
    const headEta = prevEtas[0] ?? 0;

    // 선두 호출
    const head = q.shift()!;
    head.status = TS.CALLED;
    head.updatedAt = now;
    this.byId.set(head.id, head);
    this.waiting.set(key, q);

    // 차감 규칙 적용
    const items = q.map((t, i) => ({
      id: t.id,
      number: t.number,
      etaSec: Math.max(prevEtas[i + 1] - headEta, 0),
    }));

    return { called: head, items, updatedAt: now };
  }

/** 스냅샷: 각 카운터의 last와 대기목록(etaSec 포함) */
  snapshot(hospitalId: string) {
    const counters: Record<string, { last: number; waiting: Array<Ticket & { etaSec: number }> }> = {};
    const now = Date.now();

    for (const [key, last] of this.seq.entries()) {
      const [h, c] = key.split(':');
      if (h !== hospitalId) continue;

      const q = this.waiting.get(key) ?? [];
      const waitingWithEta = q.map((t, idx) => ({
        ...t,
        etaSec: this.etaOfIndex(q, idx, now), // ★ 환자별 현재 대기시간(초)
      }));

      counters[c] = { last: last ?? 0, waiting: waitingWithEta };
    }

    return { hospitalId, counters, updatedAt: now };
  }

  /** 현재 큐의 ETA 목록 (필요 시 다른 곳에서도 사용) */
  getEtas(hospitalId: string, counterId: string) {
    const key = k(hospitalId, counterId);
    const q = (this.waiting.get(key) ?? []).slice();
    const now = Date.now();
    return q.map((t, idx) => ({
      id: t.id,
      number: t.number,
      etaSec: this.etaOfIndex(q, idx, now),
    }));
  }

  // ---------- 내부 로직 ----------

  /**
   * 큐의 i번째(0=선두) 티켓 ETA(초)
   * - 정상구간(t <= S): 선두는 감소, 뒤는 (i+1)*S - t
   * - 지연구간(t > S): 선두는 (t - S)로 증가, 뒤는 (i+1)*S + (t - S)로 증가
   */
    private etaOfIndex(q: Ticket[], i: number, nowMs: number): number {
      if (q.length === 0) return 0;
      const head = q[0];
      const t = Math.floor((nowMs - head.createdAt) / 1000); // 선두 경과(sec)
      const S = SERVICE_TIME_SEC;

      if (i === 0) return t <= S ? (S - t) : (t - S);     // 선두

      if (t <= S) return S * (i + 1) - t;             // 정상구간: 뒤는 감소
      const delay = t - S;                             // 지연구간: 뒤는 증가
      return S * (i + 1) + delay;
    }
  }
