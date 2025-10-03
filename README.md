## About Project

바로닥(BaroDoc) Backend


## How To Use

# 번호표 발급 서비스
- api/barodoc/v1/tickets (POST)
```
    {
        "hospitalId":"h1",      // 병원명
        "counterId":"1"     // 카운터 번호
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
