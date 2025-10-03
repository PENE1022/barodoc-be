import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facility } from './entities/facilities.entity';
import { FacilitiesService } from './facilities.service';
import { FacilitiesController } from './facilities.controller';
import { BusinessHour } from './entities/business-hour.entity';
import { Hospital } from 'src/hospital/hospital.entity';
import { Pharmacy } from 'src/pharmacy/pharmacy.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facility, Hospital, Pharmacy, BusinessHour])],
  controllers: [FacilitiesController],
  providers: [FacilitiesService],
})
export class FacilitiesModule {}
