export const NS = '/barodoc' as const;

export const roomLobby   = (hospitalId: string) => `lobby:${hospitalId}`;
export const roomCounter = (h: string, c: string) => `counter:${h}:${c}`;
// (선택) 특정 티켓 타겟팅할 때
export const roomTicket  = (ticketId: string) => `ticket:${ticketId}`;

export const EV = {
  HELLO:          'debug:hello',
  SNAPSHOT:       'bd:snapshot',
  TICKET_ISSUED:  'bd:ticket.issued',   // 개인 피드백용(선택)
  CREATED:        'bd:ticket.created',  // 로비/창구 방송
  CALLED:         'bd:ticket.called',   // 로비/창구 방송
  UPDATED:        'bd:ticket.updated',  // 상태 변경 공통
} as const;

export type EventName = typeof EV[keyof typeof EV];
