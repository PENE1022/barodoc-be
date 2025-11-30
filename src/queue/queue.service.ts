// src/queue/queue.service.ts
import { Injectable } from '@nestjs/common';
import { Ticket, TS, IssueTicketDto } from './dto';

type Key = string; // `${hospitalId}:${counterId}`

const keyOf = (hospitalId: string, counterId: string): Key =>
  `${hospitalId}:${counterId}`;

// 1인당 서비스 시간(초) – 5분
const SERVICE_TIME_SEC = 300;

// 미응답 처리 기준 시간(초)
// 현재는 "발급 후 5분 지나면" 미응답으로 간주
const NOSHOW_TIMEOUT_SEC = SERVICE_TIME_SEC;

@Injectable()
export class QueueService {
  /**
   * 카운터별 마지막 발급 번호
   *   key: `${hospitalId}:${counterId}`
   *   value: 마지막 번호
   */
  private readonly seq = new Map<Key, number>();

  /**
   * 대기열
   *   key: `${hospitalId}:${counterId}`
   *   value: 해당 카운터의 대기 Ticket[]
   */
  private readonly waiting = new Map<Key, Ticket[]>();

  /**
   * 티켓 ID → Ticket 조회 인덱스
   */
  private readonly byId = new Map<string, Ticket>();

  // ==========================
  //  번호표 발급 (= 병원 수락)
  // ==========================

  /**
   * 번호표 발급 (대기열 등록)
   *
   * - 병원 관리자 페이지에서 환자 정보를 보고 "수락 후 번호표 발급" 버튼을 누르면
   *   IssueTicketDto를 보내고, 이 메서드가 호출된다고 생각하면 됨.
   * - dto 안에 name/age/symptoms가 있으면, Ticket에도 같이 저장된다.
   */
  issue(dto: IssueTicketDto): Ticket {
    const { hospitalId, counterId } = dto;
    const key = keyOf(hospitalId, counterId);

    const nextNumber = (this.seq.get(key) ?? 0) + 1;
    this.seq.set(key, nextNumber);

    const now = Date.now();
    const ticket: Ticket = {
      id: `T${now}${Math.random().toString(36).slice(2, 6)}`,
      hospitalId,
      counterId,
      number: nextNumber,
      status: TS.WAITING,
      createdAt: now,
      updatedAt: now,

      // 프로토타입용 환자 정보
      name: dto.name,
      age: dto.age,
      symptoms: dto.symptoms,
    };

    const queue = this.waiting.get(key) ?? [];
    queue.push(ticket);
    this.waiting.set(key, queue);
    this.byId.set(ticket.id, ticket);

    return ticket;
  }

  // ==========================
  //  (선택) 단순 callNext – 필요 없으면 안 써도 됨
  // ==========================

  /**
   * 단순 선두 호출 버전 (ETA 차감/미응답 처리 없음)
   * 필요 없다면 사용하지 않아도 됨.
   */
  callNextSimple(hospitalId: string, counterId: string): Ticket | null {
    const key = keyOf(hospitalId, counterId);
    const queue = this.waiting.get(key) ?? [];
    const next = queue.shift();
    if (!next) return null;

    next.status = TS.CALLED;
    next.updatedAt = Date.now();

    this.waiting.set(key, queue);
    this.byId.set(next.id, next);
    return next;
  }

  // ==========================
  //  차감 규칙 callNext + 미응답 처리
  // ==========================

  /**
   * 차감 규칙 + 미응답 처리 callNext
   *
   * 1. 선두에서부터 “발급 후 NOSHOW_TIMEOUT_SEC 이상 경과한 티켓”들을
   *    미응답(TS.NOSHOW)으로 처리하고 큐에서 제거
   * 2. 남은 큐의 선두를 호출(CALLED) 상태로 변경
   * 3. 호출 직전 ETA 스냅샷 기준으로 “선두 ETA만큼 차감(하한 0)” 해서
   *    나머지 대기열 ETA를 재계산
   */
  callNextWithSubtraction(hospitalId: string, counterId: string): {
    called: Ticket | null;
    items: Array<{ id: string; number: number; etaSec: number }>;
    updatedAt: number;
  } {
    const key = keyOf(hospitalId, counterId);
    const now = Date.now();

    // 0. 선두에서 오래된 티켓 미응답 처리
    let queue = this.purgeExpiredHead(key, now);

    if (queue.length === 0) {
      return { called: null, items: [], updatedAt: now };
    }

    // 1) 호출 직전 ETA 스냅샷(선두 포함)
    const prevEtas = queue.map((_, idx) =>
      this.etaOfIndex(queue, idx, now),
    );
    const headEta = prevEtas[0] ?? 0;

    // 2) 선두 호출
    const head = queue.shift()!;
    head.status = TS.CALLED;
    head.updatedAt = now;
    this.byId.set(head.id, head);

    this.waiting.set(key, queue);

    // 3) 차감 규칙 적용 (나머지 대기열 ETA 조정)
    const items = queue.map((t, i) => ({
      id: t.id,
      number: t.number,
      etaSec: Math.max(prevEtas[i + 1] - headEta, 0),
    }));

    return { called: head, items, updatedAt: now };
  }

  // ==========================
  //  스냅샷 / ETA 조회
  // ==========================

  /**
   * 병원 전체 스냅샷
   *  - counters[cid].last: 해당 카운터의 마지막 발급 번호
   *  - counters[cid].waiting: 해당 카운터 대기열(각 티켓에 etaSec 포함)
   *  - 이 시점에서 선두 오래된 티켓은 미응답 처리 후 대기열에서 제거됨
   */
  snapshot(hospitalId: string) {
    const counters: Record<
      string,
      { last: number; waiting: Array<Ticket & { etaSec: number }> }
    > = {};
    const now = Date.now();

    for (const [key, last] of this.seq.entries()) {
      const [h, c] = key.split(':');
      if (h !== hospitalId) continue;

      // 병원/카운터별 선두 오래된 티켓 미응답 처리
      const cleanedQueue = this.purgeExpiredHead(key, now);
      const waitingWithEta = cleanedQueue.map((t, idx) => ({
        ...t,
        etaSec: this.etaOfIndex(cleanedQueue, idx, now),
      }));

      counters[c] = { last: last ?? 0, waiting: waitingWithEta };
    }

    return { hospitalId, counters, updatedAt: now };
  }

  /**
   * 특정 카운터의 현재 ETA 목록
   *  - 방금 발급된 티켓의 etaSec을 알아낼 때 주로 사용
   *  - 이 시점에서도 선두 오래된 티켓은 미응답 처리 후 제거됨
   */
  getEtas(hospitalId: string, counterId: string) {
    const key = keyOf(hospitalId, counterId);
    const now = Date.now();

    // 선두 오래된 티켓 미응답 처리
    const cleaned = this.purgeExpiredHead(key, now);
    const queue = cleaned.slice(); // 복사본

    return queue.map((t, idx) => ({
      id: t.id,
      number: t.number,
      etaSec: this.etaOfIndex(queue, idx, now),
    }));
  }

  // ==========================
  //  내부 ETA 계산 로직
  // ==========================

  /**
   * 큐의 i번째(0 = 선두) 티켓 ETA(초) 계산
   *
   *  t = nowMs - head.createdAt (초)
   *  S = 1인당 서비스 시간 (SERVICE_TIME_SEC)
   *
   *  선두(i=0):
   *    - 정상구간(t <= S): S - t  (0까지 감소)
   *    - 지연구간(t > S): t - S  (지연된 만큼 증가)
   *
   *  뒤(i > 0):
   *    - 정상구간(t <= S): (i+1)*S - t
   *    - 지연구간(t > S): (i+1)*S + (t - S)
   */
  private etaOfIndex(queue: Ticket[], i: number, nowMs: number): number {
    if (queue.length === 0) return 0;

    const head = queue[0];
    const t = Math.floor((nowMs - head.createdAt) / 1000); // 선두 경과(sec)
    const S = SERVICE_TIME_SEC;

    // 선두
    if (i === 0) {
      return t <= S ? S - t : t - S;
    }

    // 뒤에 있는 티켓들
    if (t <= S) {
      // 정상 구간: 전체가 같이 감소
      return S * (i + 1) - t;
    }

    // 지연 구간: 지연만큼 전체에 가산
    const delay = t - S;
    return S * (i + 1) + delay;
  }

  // ==========================
  //  미응답 처리 로직
  // ==========================

  /**
   * 선두에서부터 "발급 후 NOSHOW_TIMEOUT_SEC 이상 경과한 티켓"을
   * 미응답(TS.NOSHOW)으로 처리하고 큐에서 제거한다.
   *
   * - createdAt 기준
   * - 여러 개가 연속으로 오래된 경우 모두 제거
   * - 제거된 티켓은 byId에 status = '미응답' 으로 업데이트됨
   * - 반환값: 정리된 큐
   */
  private purgeExpiredHead(key: Key, nowMs: number): Ticket[] {
    let queue = this.waiting.get(key) ?? [];
    let changed = false;

    while (queue.length > 0) {
      const head = queue[0];
      const elapsedSec = Math.floor((nowMs - head.createdAt) / 1000);

      // 아직 유효 => 더 이상 제거할 필요 없음
      if (elapsedSec <= NOSHOW_TIMEOUT_SEC) break;

      // 발급 후 너무 오래 기다려서 미응답으로 처리
      head.status = TS.NOSHOW;
      head.updatedAt = nowMs;
      this.byId.set(head.id, head);

      // 대기열에서 제거
      queue.shift();
      changed = true;
    }

    if (changed) {
      this.waiting.set(key, queue);
    }

    return queue;
  }
}
