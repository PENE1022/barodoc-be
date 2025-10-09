import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

// DB 연결 상태 확인을 위한 Controller
@Controller('health')
export class DbPingController {
  constructor(private readonly ds: DataSource) {}
  @Get('db')
  async ping() {
    const [row] = await this.ds.query('SELECT 1 AS ok');
    return { ok: !!row?.ok };
  }
}
