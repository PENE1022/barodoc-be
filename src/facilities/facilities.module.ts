import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './entities/facilities.entity';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { BusinessHour } from './entities/business-hour.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, BusinessHour])],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
