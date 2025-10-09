// 네임스페이스/룸/이벤트 컨벤션 (BaroDoc)
export const NS = '/barodoc';
export const roomLobby = (hospitalId: string) => `lobby:${hospitalId}`;
export const roomCounter = (h: string, c: string) => `counter:${h}:${c}`;

export const EV = {
  SNAPHOT:        'bd:snapshot',
  TICKET_ISSUED:  'bd:ticket.issued',   // 발급자 개인 피드백(선택)
  CREATED:        'bd:ticket.created',  // 로비/창구 방송
  CALLED:         'bd:ticket.called',   // 로비/창구 방송
  UPDATED:        'bd:ticket.updated',  // 상태 변경 공통
} as const;
