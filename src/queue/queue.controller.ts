import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CallNextDto, IssueTicketDto } from './dto';
import { QueueGateway } from './queue.gateway';
import { EV } from './events';

@Controller('api/barodoc/v1')
export class QueueController {
  constructor(
    private readonly svc: QueueService,
    private readonly gw: QueueGateway,
  ) {}

  // 번호표 발급
  @Post('tickets')
  issue(@Body() dto: IssueTicketDto) {
    if (!dto.hospitalId || !dto.counterId) {
      throw new BadRequestException('hospitalId/counterId required');
    }

    const t = this.svc.issue(dto.hospitalId, dto.counterId);

    // 현재 큐의 ETA 계산 후, 방금 발급된 티켓의 ETA 추출
    const items = this.svc.getEtas(t.hospitalId, t.counterId); // [{id, number, etaSec}]
    const mine  = items.find(x => x.id === t.id);
    const etaSec = mine ? mine.etaSec : null;

    // 1) CREATED 이벤트에도 etaSec 포함해 방송
    this.gw.emitTicketCreated(
      { hospitalId: t.hospitalId, counterId: t.counterId },
      { ticket: { ...t, etaSec } },          // etaSec 포함
    );

    // 2) UPDATED(리스트 전체 ETA)도 즉시 방송(선택)
    this.gw.emitUpdated(t.hospitalId, {
      hospitalId: t.hospitalId,
      counterId: t.counterId,
      items,                                  // 전체 [{id, number, etaSec}]
      updatedAt: Date.now(),
    });

    // 3) HTTP 응답에도 etaSec 포함
    return { ...t, etaSec };
  }

  // 번호표 호출 (차감 규칙)
  @Post('counters/:counterId/call-next')
  @HttpCode(200)
  callNext(@Param('counterId') counterId: string, @Body() dto: CallNextDto) {
    if (!dto.hospitalId) throw new BadRequestException('hospitalId required');

    const { called, items, updatedAt } =
      this.svc.callNextWithSubtraction(dto.hospitalId, counterId);

    if (!called) return { ok: true, message: 'EMPTY' };

    // 1) 호출 이벤트
    this.gw.emitTicketCalled(
      { hospitalId: called.hospitalId, counterId: called.counterId },
      { ticket: called },
    );

    // 2) 차감 규칙으로 갱신된 ETA 브로드캐스트
    this.gw.emitUpdated(called.hospitalId, {
      hospitalId: called.hospitalId,
      counterId,
      items,        // [{ id, number, etaSec }, ...]
      updatedAt,
    });

    // HTTP 응답(호출된 티켓 + 차감 후 ETA 요약)
    return { called, items, updatedAt };
  }

  // 병원 스냅샷
  @Get('snapshot')
  snapshot(@Query('hospitalId') hospitalId: string) {
    if (!hospitalId) throw new BadRequestException('hospitalId required');

    // etaSec 포함된 스냅샷
    const s = this.svc.snapshot(hospitalId);

    // 로비로 “요약” 방송(기존과 동일: 카운터별 대기 인원수 정도만)
    this.gw.emitSnapshot(hospitalId, {
      hospitalId,
      counters: Object.fromEntries(
        Object.entries(s.counters).map(([cid, v]) => [cid, {
          last: v.last,
          waitingCount: v.waiting.length,
        }]),
      ),
      updatedAt: s.updatedAt,
    });

    // HTTP 응답으로는 환자별 etaSec까지 포함해서 반환
    return s;
  }
}
