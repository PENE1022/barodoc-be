import { Column, Entity, Index, OneToMany, PrimaryColumn } from 'typeorm';
import { FacilityType } from '../facility.types';
import { BusinessHour } from './business-hour.entity';

@Entity('facilities')
@Index(['type', 'name'])
@Index('ix_facilities_active', ['isActive'])
export class Facility {
  @PrimaryColumn('char', { length: 36 })
  id!: string; // UUID (CHAR(36))

  @Column({ type: 'enum', enum: FacilityType })
  type!: FacilityType;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 25, nullable: true })
  phone?: string;

  @Column({ name: 'road_address', length: 200, nullable: true })
  roadAddress?: string;

  @Column({ name: 'detail_address', length: 200, nullable: true })
  detailAddress?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng?: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => BusinessHour, (bh) => bh.facility)
  hours?: BusinessHour[];

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;
}
