import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Facility } from '../facilities/entities/facilities.entity'; 

@Entity('hospitals')
export class Hospital {
  @PrimaryColumn('char', { length: 36, name: 'facility_id' })
  facilityId!: string;

  @OneToOne(() => Facility, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'facility_id' })   // FK 컬럼명 DB와 동일
  facility!: Facility;

  @Column({ name: 'license_no', type: 'varchar', length: 50, unique: true, nullable: true })
  licenseNo?: string | null;             

  @Column({ name: 'level',type: 'varchar', length: 100, nullable: true })
  level?: string | null;                 

  @Column({ type: 'json', nullable: true })
  departments?: string[] | null;         
}
