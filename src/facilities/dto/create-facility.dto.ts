import {
  IsEnum, IsOptional, IsPhoneNumber, IsString, IsLatitude, IsLongitude,
  Length, ValidateNested, IsArray, IsInt, Min, Max, IsBoolean, Matches
} from 'class-validator';
import { Type } from 'class-transformer';
import { FacilityType } from '../facility.types';

export class BusinessHourDto {
  @Type(() => Number)
  @IsInt() @Min(0) @Max(6)
  dayOfWeek!: number;                 // 0=일 ~ 6=토

  // TIME 컬럼과 정합: "HH:mm" 또는 "HH:mm:ss"
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  openAt?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  closeAt?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  breakStart?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
  breakEnd?: string;

  @Type(() => Boolean)
  @IsBoolean() @IsOptional()
  is24h?: boolean;

  @Type(() => Boolean)
  @IsBoolean() @IsOptional()
  openOnHolidays?: boolean;
}

export class CreateFacilityDto {
  @IsEnum(FacilityType)
  type!: FacilityType;                // 'HOSPITAL' | 'PHARMACY'

  @IsString() @Length(1, 120)
  name!: string;

  @IsOptional() @IsPhoneNumber('KR')
  phone?: string;

  @IsOptional() @IsString()
  roadAddress?: string;

  @IsOptional() @IsString()
  detailAddress?: string;

  @IsOptional() @Type(() => Number) @IsLatitude()
  lat?: number;

  @IsOptional() @Type(() => Number) @IsLongitude()
  lng?: number;

  @IsArray() @ValidateNested({ each: true }) @Type(() => BusinessHourDto)
  @IsOptional()
  hours?: BusinessHourDto[];

  // 병원/약국 세부 (선택 입력)
  @IsOptional() @Type(() => HospitalDetailDto)
  hospital?: HospitalDetailDto;

  @IsOptional() @Type(() => PharmacyDetailDto)
  pharmacy?: PharmacyDetailDto;
}

// 병원 세부
export class HospitalDetailDto {
  @IsOptional() @IsString()
  licenseNo?: string;

  @IsOptional() @IsString()
  level?: string;

  @IsOptional() @IsArray()
  departments?: string[];             // DB: JSON
}

// 약국 세부
export class PharmacyDetailDto {
  @IsOptional() @Type(() => Boolean)
  isDeliveryAvailable?: boolean;      // DB: pharmacies.is_delivery_available
}
