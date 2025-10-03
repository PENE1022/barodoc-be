import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { FacilityType } from '../facility.types';
import { BusinessHour } from './business-hour.entity';

@Entity('facilities')
@Index(['type', 'name'])
@Index('ix_facilities_active', ['isActive'])
export class Facility {
  @PrimaryColumn('char', { length: 36 })
  id!: string;

  @Column({ type: 'enum', enum: FacilityType })
  type!: FacilityType;

  @Column({ length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 25, nullable: true })
  phone?: string | null;                 

  @Column({ name: 'road_address', type: 'varchar', length: 200, nullable: true })
  roadAddress?: string | null;           

  @Column({ name: 'detail_address', type: 'varchar', length: 200, nullable: true })
  detailAddress?: string | null;         

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat?: number | null;                   

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng?: number | null;                   

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => BusinessHour, (bh) => bh.facility)
  hours?: BusinessHour[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  @Column({ name: 'deleted_at', type: 'datetime', nullable: true })
  deletedAt?: Date | null;              
}

