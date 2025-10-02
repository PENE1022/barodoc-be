import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facility } from './entities/facilities.entity';
import { FacilityQueryDto } from './dto/facility.query.dto';
import { BusinessHour } from './entities/business-hour.entity';
import { BusinessHourDto } from './dto/create-facility.dto'

@Injectable()
export class FacilitiesService {
  constructor(
    @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
    @InjectRepository(BusinessHour) private readonly hourRepo: Repository<BusinessHour>,
  ) {}

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
