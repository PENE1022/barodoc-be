## About Project

바로닥(BaroDoc) 백엔드 서비스입니다. 3학년 2학기 안양우 팀장과 지혜성 학생의 크로스 앱 플랫폼 프로젝트 입니다.

- 일반 사용자: 병원과 약국 예약 대기
- 관리자 : 병원과 약국 등록 및 환자 현황 확인

## 수정 사항

- v.1.0.0
    1. 병원 및 약국 등 시설 등록 및 저장
    2. 병원 내 번호표 발급 및 호출 서비스

- v.1.0.1
    1. 병원 내 번호표 발급 → 병원에서 환자 정보 확인 후, 수락 시
    2. 환자 호출 시스템 내 에러 수정 (대기 시간 초과 시 미삭제)


## How To Use

# 번호표 발급 서비스 (v2)
- api/barodoc/v1/tickets (POST)
```
    {
        "hospitalId":"h1",      // 병원명
        "counterId":"1",     // 카운터 번호
        "name": "홍길동",   // 환자명
        "age": 32,      // 나이
        "symptoms": "복통, 발열"    // 증상
    }
```

# 대기인원 호출 기능
- api/barodoc/v1/counters/1/call-next (POST)
```
    {
        "hospitalId":"h1"   // 병원명
    }
```

# 현재 병원 내 인원 현황
- api/barodoc/v1/snapshot (GET)
```
    {
        "hospitalId":"h1"   // 병원명
    }
```

# 시설 전체 조회
- api/barodoc/v1/facilities (GET)
```
    {
        "id": "165c4ce2-9f59-11f0-b40f-00155d00784c",
        "type": "PHARMACY",
        "name": "한빛약국",
        "phone": "+82-2-987-6543",
        "roadAddress": "서울특별시 OO구 OO길 45",
        "detailAddress": null,
        "lat": "37.5010000",
        "lng": "127.0396000",
        "isActive": true,
        "createdAt": "2025-10-02T06:29:04.000Z",
        "updatedAt": "2025-10-02T06:29:04.000Z",
        "deletedAt": null
    }
```

# 병원 / 약국 등록 서비스
- api/barodoc/v1/facilities (POST)
- licenseNo(병원) 중복 시 에러
```
    {
    "type": "PHARMACY",
    "name": "지우약국",
    "phone": "031-987-6543",
    "roadAddress": "경기도 안양시 OO구 OO길 45",
    "detailAddress": "12로 3456",
    "lat": 37.5010000,
    "lng": 127.0396000,
    "pharmacy": {
        "isDeliveryAvailable": true
    },
    "hours": [
        { "dayOfWeek": 1, "openAt": "09:00", "closeAt": "23:00", "openOnHolidays": true },
        { "dayOfWeek": 2, "openAt": "09:00", "closeAt": "23:00", "openOnHolidays": true }
    ]
    }

    {
    "type": "HOSPITAL",
    "name": "김씨네병원",
    "phone": "031-123-1234",
    "roadAddress": "경기도 OO시 OO구 OO로 123",
    "detailAddress": "본관 3층",
    "lat": 37.1234567,
    "lng": 127.1234567,
    "hospital": {
      "licenseNo": "B123456",
      "level": "의원",
      "departments": ["내과", "소아청소년과"]
    },
    "hours": [
      { "dayOfWeek": 1, "openAt": "09:00", "closeAt": "18:00", "breakStart": "12:30", "breakEnd": "13:30" },
      { "dayOfWeek": 2, "openAt": "09:00", "closeAt": "18:00" },
      { "dayOfWeek": 6, "openAt": "09:00", "closeAt": "13:00" }
    ]
  }
```


# 모든 시설의 ID 및 위도/경도 받는 기능
- api/barodoc/v1/facilities/coords?active=1     (GET)
- active=1 인 이유는 현재 영업 중인 시설 확인용.
```
    {
        "total": 907,
        "items": [
            {
                "id": "00277989-3410-5caa-b6ac-3cde6fbd76fd",
                "lat": 37.402757,
                "lng": 126.9105982
            }, ....
        ]
    }
```