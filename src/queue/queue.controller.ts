// src/queue/queue.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CallNextDto, IssueTicketDto } from './dto';
import { QueueGateway } from './queue.gateway';

@Controller('api/barodoc/v1')
export class QueueController {
  constructor(
    private readonly queueService: QueueService,
    private readonly gateway: QueueGateway,
  ) {}

  // ==========================
  //  번호표 발급 (병원 수락)
  // ==========================

  /**
   * 번호표 발급 API
   *
   * - 환자 정보 입력 후, 병원 관리자 화면에서 내용을 "확인"하고
   *   "수락 후 번호표 발급" 버튼을 누를 때 이 API를 호출한다고 보면 된다.
   *
   * Request Body: IssueTicketDto
   *   - hospitalId, counterId
   *   - name?, age?, symptoms? (옵션, 프로토타입용)
   */
  @Post('tickets')
  issue(@Body() dto: IssueTicketDto) {
    if (!dto.hospitalId || !dto.counterId) {
      throw new BadRequestException('hospitalId/counterId required');
    }

    const ticket = this.queueService.issue(dto);

    // 현재 큐의 ETA 목록에서 방금 발급된 티켓의 etaSec 추출
    const items = this.queueService.getEtas(ticket.hospitalId, ticket.counterId);
    const mine = items.find((x) => x.id === ticket.id);
    const etaSec = mine ? mine.etaSec : null;

    // 1) CREATED 이벤트 (개별 티켓 + etaSec)
    this.gateway.emitTicketCreated(
      { hospitalId: ticket.hospitalId, counterId: ticket.counterId },
      { ticket: { ...ticket, etaSec } },
    );

    // 2) UPDATED 이벤트 (해당 카운터 전체 ETA 리스트)
    this.gateway.emitUpdated(ticket.hospitalId, {
      hospitalId: ticket.hospitalId,
      counterId: ticket.counterId,
      items, // [{ id, number, etaSec }]
      updatedAt: Date.now(),
    });

    // 3) HTTP 응답 (etaSec 포함)
    return { ...ticket, etaSec };
  }

  // ==========================
  //  번호표 호출 (차감 규칙 + 미응답 처리)
  // ==========================

  /**
   * 번호표 호출 API
   *
   * - 선두에서 오래된 티켓은 자동으로 미응답 처리(TS.NOSHOW) 후 큐에서 제거
   * - 남은 선두 티켓을 호출(CALLED) 상태로 변경
   * - 나머지 대기열은 “선두 ETA만큼 차감(하한 0)” 규칙으로 ETA 재계산
   */
  @Post('counters/:counterId/call-next')
  @HttpCode(200)
  callNext(
    @Param('counterId') counterId: string,
    @Body() dto: CallNextDto,
  ) {
    if (!dto.hospitalId) {
      throw new BadRequestException('hospitalId required');
    }

    const { called, items, updatedAt } =
      this.queueService.callNextWithSubtraction(dto.hospitalId, counterId);

    if (!called) {
      // 미응답 처리로 다 비었거나, 원래 대기열이 비어있는 경우
      return { ok: true, message: 'EMPTY' };
    }

    // 1) 호출 이벤트 (현재 카운터에서 불린 환자)
    this.gateway.emitTicketCalled(
      { hospitalId: called.hospitalId, counterId: called.counterId },
      { ticket: called },
    );

    // 2) ETA 업데이트 브로드캐스트 (대기열 요약용)
    this.gateway.emitUpdated(called.hospitalId, {
      hospitalId: called.hospitalId,
      counterId,
      items, // [{ id, number, etaSec }]
      updatedAt,
    });

    // 3) HTTP 응답
    return { called, items, updatedAt };
  }

  // ==========================
  //  병원 스냅샷
  // ==========================

  /**
   * 병원 전체 스냅샷 조회
   *
   * - HTTP 응답:
   *    hospitalId,
   *    counters[cid].last,
   *    counters[cid].waiting[ ].etaSec 포함
   *
   * - WebSocket 스냅샷 이벤트:
   *    로비 요약용 (카운터별 waitingCount만 보냄)
   *
   * - 이 시점에서도 선두 오래된 티켓은 미응답 처리 후 제거됨
   */
  @Get('snapshot')
  snapshot(@Query('hospitalId') hospitalId: string) {
    if (!hospitalId) {
      throw new BadRequestException('hospitalId required');
    }

    const snapshot = this.queueService.snapshot(hospitalId);

    // 로비 요약용 브로드캐스트 (카운터별 대기 인원 수만)
    this.gateway.emitSnapshot(hospitalId, {
      hospitalId,
      counters: Object.fromEntries(
        Object.entries(snapshot.counters).map(([counterId, v]) => [
          counterId,
          {
            last: v.last,
            waitingCount: v.waiting.length,
          },
        ]),
      ),
      updatedAt: snapshot.updatedAt,
    });

    // HTTP 응답: 환자별 etaSec까지 포함
    return snapshot;
  }
}
