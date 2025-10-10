import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CallNextDto, IssueTicketDto } from './dto';
import { QueueGateway } from './queue.gateway';

@Controller('api/barodoc/v1')
export class QueueController {
  constructor(
    private readonly svc: QueueService,
    private readonly gw: QueueGateway,
  ) {}

  // 번호표 발급
  @Post('tickets')
  issue(@Body() dto: IssueTicketDto) {
    if (!dto.hospitalId || !dto.counterId) throw new BadRequestException('hospitalId/counterId required');
    const t = this.svc.issue(dto.hospitalId, dto.counterId);
    this.gw.emitTicketCreated({ hospitalId: t.hospitalId, counterId: t.counterId }, { ticket: t });
    return t;
  }

  // 번호표 호출
  @Post('counters/:counterId/call-next')
  @HttpCode(200)
  callNext(@Param('counterId') counterId: string, @Body() dto: CallNextDto) {
    if (!dto.hospitalId) throw new BadRequestException('hospitalId required');
    const called = this.svc.callNext(dto.hospitalId, counterId);
    if (!called) return { ok: true, message: 'EMPTY' };
    this.gw.emitTicketCalled({ hospitalId: called.hospitalId, counterId: called.counterId }, { ticket: called });
    return called;
  }

  // 병원 스냅샷
  @Get('snapshot')
  snapshot(@Query('hospitalId') hospitalId: string) {
    if (!hospitalId) throw new BadRequestException('hospitalId required');
    const s = this.svc.snapshot(hospitalId);
    // 필요 시 방송
    this.gw.emitSnapshot(hospitalId, {
      hospitalId,
      counters: Object.fromEntries(
        Object.entries(s.counters).map(([cid, v]) => [cid, { last: v.last, waiting: v.waiting.length }])
      ),
      updatedAt: Date.now(),
    });
    return s;
  }
}
