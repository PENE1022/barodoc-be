import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Facility } from './facilities.entity';

@Entity('business_hours')
@Index(['facility', 'dayOfWeek']) // (facility_id, day_of_week) 인덱스
export class BusinessHour {
  @PrimaryGeneratedColumn('uuid')
  id!: string; // CHAR(36)

  @ManyToOne(() => Facility, (f) => f.hours, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' }) // FK 컬럼명 고정
  facility!: Facility;

  @Column({ name: 'day_of_week', type: 'tinyint', unsigned: true }) // 0 = 월 ... 6 = 일
  dayOfWeek!: number;

  @Column({ name: 'open_at', type: 'time', nullable: true })       // TIME
  openAt?: string;

  @Column({ name: 'close_at', type: 'time', nullable: true })      // TIME
  closeAt?: string;

  @Column({ name: 'break_start', type: 'time', nullable: true })
  breakStart?: string;

  @Column({ name: 'break_end', type: 'time', nullable: true })
  breakEnd?: string;

  @Column({ name: 'is_24h', type: 'boolean', default: false })
  is24h!: boolean;

  @Column({ name: 'open_on_holidays', type: 'boolean', default: false })
  openOnHolidays!: boolean;
}
