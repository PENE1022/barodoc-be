import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { FacilitiesService } from './facilities.service';
import { FacilityQueryDto } from './dto/facility.query.dto';
import { CreateFacilityDto } from './dto/create-facility.dto';

@Controller('api/barodoc/v1/facilities')
export class FacilitiesController {
  constructor(private readonly svc: FacilitiesService) {}

  @Get()
  list(@Query() query: FacilityQueryDto) {
    return this.svc.findAll(query);
  }

  // 모든 시설의 위도, 경도를 받는 기능
  @Get('coords')
  listCoords(@Query('active') active?: '0' | '1') {
    return this.svc.listCoords(active === '0' ? 0 : 1);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const row = await this.svc.findOne(id);
    return row ?? { ok: false, message: 'NOT_FOUND' };
  }

  // 시설 (병원, 약국) 생성 기능
  @Post()
  create(@Body() dto: CreateFacilityDto) {
    return this.svc.createCascade(dto);
  }



}
