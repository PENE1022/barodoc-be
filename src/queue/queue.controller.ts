import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { QueueService } from './queue.service';
import { CallNextDto, IssueTicketDto } from './dto';
import { QueueGateway } from './queue.gateway';

@Controller('api/barodoc/v1')
export class QueueController {
  constructor(
    private readonly svc: QueueService,
    private readonly gw: QueueGateway,
  ) {}

  // 번호표 발급 (POST)
  @Post('tickets')
  issue(@Body() dto: IssueTicketDto) {
    const t = this.svc.issue(dto.hospitalId, dto.counterId);
    // 실시간 방송
    this.gw.emitTicketCreated({ hospitalId: t.hospitalId, counterId: t.counterId }, t);
    // 발급자에게는 HTTP 응답으로 바로 반환
    return t;
  }

  // 번호표 호출 (POST)
  @Post('counters/:counterId/call-next')
  @HttpCode(200)
  callNext(@Param('counterId') counterId: string, @Body() dto: CallNextDto) {
    const called = this.svc.callNext(dto.hospitalId, counterId);
    if (!called) return { ok: true, message: 'EMPTY' };
    // 실시간 방송
    this.gw.emitTicketCalled({ hospitalId: called.hospitalId, counterId: called.counterId }, called);
    return called;
  }

  // 현재 병원별 대기 현황을 조회하는 기능 (GET) -> 인원 대기열 시간 추가 및 인원 출력 
  @Get('snapshot')
  snapshot(@Query('hospitalId') hospitalId: string) {
    return this.svc.snapshot(hospitalId);
  }
}
