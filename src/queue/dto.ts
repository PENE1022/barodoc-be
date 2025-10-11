import { IsString, Matches /*, IsUUID*/ } from 'class-validator';

export type TicketStatus =
  | '대기중'
  | '호출됨'
  | '처리 완료'
  | '접수 취소'
  | '미응답';

export const TS = {
  WAITING: '대기중' as TicketStatus,
  CALLED:  '호출됨' as TicketStatus,
  DONE:    '처리 완료' as TicketStatus,
  CANCEL:  '접수 취소' as TicketStatus,
  NOSHOW:  '미응답' as TicketStatus,
};

// DTO
export class IssueTicketDto {
  // 병원ID가 UUID라면 IsUUID로 바꿔도 됨
  @IsString() /* @IsUUID() */
  hospitalId!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/)
  counterId!: string;
}

export class CallNextDto {
  @IsString() /* @IsUUID() */
  hospitalId!: string;
}

// 엔티티 인터페이스(메모리용)
export interface Ticket {
  id: string;
  hospitalId: string;
  counterId: string;
  number: number;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
}
