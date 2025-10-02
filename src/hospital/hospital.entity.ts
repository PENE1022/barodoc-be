// src/hospitals/entities/hospital.entity.ts
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Facility } from '../../src/facilities/entities/facilities.entity';

@Entity('hospitals')
export class Hospital {
  @PrimaryColumn('uuid')
  facilityId!: string;

  @OneToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facilityId' })
  facility!: Facility;

  @Column({ length: 50, nullable: true })
  licenseNo?: string; // 요양기관번호 등

  @Column({ length: 100, nullable: true })
  level?: string; // 상급종합/종합/의원 등

  @Column({ type: 'json', nullable: true })
  departments?: string[]; // ["내과","소아청소년과"] 간단 버전
}
