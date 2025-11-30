// src/queue/dto.ts
import {
  IsString,
  Matches,
  IsOptional,
  IsNumber,
} from 'class-validator';

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

// 번호표 발급(=병원에서 수락) 요청 DTO
export class IssueTicketDto {
  // 병원 ID (UUID면 @IsUUID로 변경 가능)
  @IsString() /* @IsUUID() */
  hospitalId!: string;

  // 카운터 ID: 영문/숫자/언더바/하이픈만 허용
  @IsString()
  @Matches(/^[A-Za-z0-9_-]+$/)
  counterId!: string;

  // ====== 프로토타입용 환자 정보 (관리자가 보고 수락) ======

  @IsOptional()
  @IsString()
  name?: string;        // 환자 이름

  @IsOptional()
  @IsNumber()
  age?: number;         // 나이

  @IsOptional()
  @IsString()
  symptoms?: string;    // 증상 요약 (예: "복통, 발열")
}

// 다음 환자 호출 DTO
export class CallNextDto {
  @IsString() /* @IsUUID() */
  hospitalId!: string;
}

// 메모리용 티켓 엔티티
export interface Ticket {
  id: string;
  hospitalId: string;
  counterId: string;
  number: number;
  status: TicketStatus;
  createdAt: number; // ms
  updatedAt: number; // ms

  // 프로토타입용 환자 정보
  name?: string;
  age?: number;
  symptoms?: string;
}
