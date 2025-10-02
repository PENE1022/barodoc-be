// src/pharmacies/entities/pharmacy.entity.ts
import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Facility } from '../../src/facilities/entities/facilities.entity';

@Entity('pharmacies')
export class Pharmacy {
  @PrimaryColumn('uuid')
  facilityId!: string;

  @OneToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facilityId' })
  facility!: Facility;

  @Column({ default: false })
  isNightPharmacy!: boolean; // 심야약국

  @Column({ default: false })
  isDeliveryAvailable!: boolean; // 배달/조제전달(정책에 맞게 내부 플래그)
}
