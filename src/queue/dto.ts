// src/queue/dto.ts
import { IsString, Matches } from 'class-validator';

export type TicketStatus =
  | '대기중'     // 대기 중
  | '호출됨'      // 창구에서 호출됨
  | '처리 완료'        // 처리 완료
  | '접수 취소'   // 접수 취소
  | '미응답';     // 호출했지만 미응답

export class IssueTicketDto {
  @IsString()
  hospitalId!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/)
  counterId!: string;
}

export class CallNextDto {
  @IsString()
  hospitalId!: string;
}

export interface Ticket {
  id: string;           // 전역 유니크 ID (예: T1738...abcd)
  hospitalId: string;   // 병원 식별자
  counterId: string;    // 창구 식별자
  number: number;       // 사람이 보는 연속번호(창구/일자 기준 증가)
  status: TicketStatus; // WAITING → CALLED → DONE/CANCELLED/NOSHOW
  createdAt: number;    // epoch ms
  updatedAt: number;    // epoch ms
}
