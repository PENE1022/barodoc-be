import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Facility } from '../facilities/entities/facilities.entity';

@Entity('pharmacies')
export class Pharmacy {
  // PK=FK → facility_id (CHAR(36))
  @PrimaryColumn('char', { length: 36, name: 'facility_id' })
  facilityId!: string;

  @OneToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' }) // FK 컬럼명 매핑 필수
  facility!: Facility;

  @Column({ name: 'is_delivery_available', type: 'boolean', default: false })
  isDeliveryAvailable!: boolean;
}
