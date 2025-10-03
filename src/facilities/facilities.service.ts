import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryFailedError, Repository } from 'typeorm';
import { v4 as uuid} from 'uuid';

import { Facility } from './entities/facilities.entity';
import { FacilityQueryDto } from './dto/facility.query.dto';

import { BusinessHour } from './entities/business-hour.entity';
import { BusinessHourDto, CreateFacilityDto } from './dto/create-facility.dto'
import { Hospital } from 'src/hospital/hospital.entity';
import { Pharmacy } from 'src/pharmacy/pharmacy.entity';
import { FacilityType } from './facility.types';

@Injectable()
export class FacilitiesService {
  constructor(
    private readonly ds: DataSource,
    @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(BusinessHour) private readonly hourRepo: Repository<BusinessHour>,
    @InjectRepository(Hospital) private readonly hospitalRepo: Repository<Hospital>,
    @InjectRepository(Pharmacy) private readonly pharmacyRepo: Repository<Pharmacy>,

  ) {}

  /* 
    시설 (병원/약국) + 영업 시간을 Insert
      - DB 스키마: facilities / hospital / pharmacy / business_hours
  */

  async createCascade(dto: CreateFacilityDto) {
    const facId = uuid(); // 시설 ID는 uuid 로 생성

    try {
      const result = await this.ds.transaction(async (em) => {
        // 시설 DB 먼저 삽입
        const facility = em.create(Facility, {
          id: facId,
          type: dto.type,
          name: dto.name,
          phone: dto.phone ?? null,
          roadAddress: dto.roadAddress,
          detailAddress: dto.detailAddress,
          lat: dto.lat,
          lng: dto.lng,
          isActive: dto.isActive ?? true,
        });
        await em.save(facility);

        // 병원 / 약국 전용
        let hospital: Hospital | null = null;
        let pharmacy: Pharmacy | null = null;

        // 병원
        if (dto.type === FacilityType.HOSPITAL && dto.hospital) {
          hospital = em.create(Hospital, {
            facilityId: facId, // 기본키 = 외래키 지정
            licenseNo: dto.hospital.licenseNo ?? null,
            level: dto.hospital.level ?? null,
            departments: dto.hospital.departments ?? [], // 진료 과목 json 데이터
          });
          await em.save(hospital);
        }

        // 약국
        if (dto.type === FacilityType.PHARMACY && dto.pharmacy) {
          pharmacy = em.create(Pharmacy, {
            facilityId: facId,
            isDeliveryAvailable: dto.pharmacy?.isDeliveryAvailable,
          });
          await em.save(pharmacy);
        }

        // 영업 시간(배열)
      let hours: BusinessHour[] = [];

      if (dto.hours?.length) {
        hours = dto.hours.map((h: BusinessHourDto) =>
        em.create(BusinessHour, {
          facility: { id: facId } as Facility,
          dayOfWeek: h.dayOfWeek,
          openAt: this.toTime(h.openAt),
          closeAt: this.toTime(h.closeAt),
          breakStart: this.toTime(h.breakStart),
          breakEnd: this.toTime(h.breakEnd),
          is24: h.is24h,
          openOnHolidays: h.openOnHolidays,
        }),
        );
        await em.save(hours);
      }

      return { facility, hospital, pharmacy, hours }; 
      });

      return {
        ...result.facility,
        hospital: result.hospital ?? undefined,
        pharmacy: result.pharmacy ?? undefined,
        hours: result.hours ?? [],
      }

    } catch(error) {
      if(error instanceof QueryFailedError) {
        if((error as any).error === 1062) {
          throw new ConflictException('중복된 키 입니다.');
        }
      }

      throw error;
    } 
  }

  // 시설 전체 조회 기능
  async findAll(qp: FacilityQueryDto) {
    const { q, type, page = 1, pageSize = 20, active } = qp;

    const qb = this.facilityRepo.createQueryBuilder('f')
      .where('f.deleted_at IS NULL');

    if (type) qb.andWhere('f.type = :type', { type });
    if (active === 1) qb.andWhere('f.is_active = TRUE');
    if (active === 0) qb.andWhere('f.is_active = FALSE');

    if (q && q.trim()) {
      qb.andWhere(
        '(f.name LIKE :kw OR f.road_address LIKE :kw OR f.detail_address LIKE :kw)',
        { kw: `%${q.trim()}%` },
      );
    }

    qb.orderBy('f.name', 'ASC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return {
      total,
      page,
      pageSize,
      items,
    };
  }

  findOne(id: string) {
    return this.facilityRepo.findOne({
      where: { id, deletedAt: null as any },
    });
  }

  private toTime(s?: string) {
    if (!s) return undefined;
    return s.length === 5 ? `${s}:00` : s; // "HH:mm" -> "HH:mm:ss"
  }

  async addHours(facilityId: string, items: BusinessHourDto[]) {
    const facility = await this.facilityRepo.findOne({ where: { id: facilityId } });
    if (!facility) throw new NotFoundException('해당 시설이 없습니다.');

    const rows = items.map(i =>
      this.hourRepo.create({
        facility,
        dayOfWeek: i.dayOfWeek,
        openAt: this.toTime(i.openAt),
        closeAt: this.toTime(i.closeAt),
        breakStart: this.toTime(i.breakStart),
        breakEnd: this.toTime(i.breakEnd),
        is24h: !!i.is24h,
        openOnHolidays: !!i.openOnHolidays,
      }),
    );
    return this.hourRepo.save(rows);
  }

  listHours(facilityId: string) {
    return this.hourRepo.find({
      where: { facility: { id: facilityId } as any },
      order: { dayOfWeek: 'ASC', openAt: 'ASC' },
    });
  }

  async removeHour(facilityId: string, hourId: string) {
    // 시설 소유 검증 후 삭제
    const row = await this.hourRepo.findOne({
      where: { id: hourId },
      relations: { facility: true },
    });
    if (!row || row.facility.id !== facilityId) throw new NotFoundException('HOUR_NOT_FOUND');
    await this.hourRepo.delete(hourId);
    return { ok: true };
  }
}
