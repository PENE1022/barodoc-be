## About Project

바로닥(BaroDoc) Backend


## How To Use
- api/barodoc/v1/tickets (번호표 발급)
```
    {
        "hospitalId":"h1",      // 병원명
        "counterId":"1"     // 카운터 번호
    }
```

- api/barodoc/v1/counters/1/call-next (번호순 호출)
```
    {
        "hospitalId":"h1"   // 병원명
    }
```

- api/barodoc/v1/snapshot (현재 병원 현황)
```
    {
        "hospitalId":"h1"   // 병원명
    }
```

- api/barodoc/v1/facilities ( GET 방식, 시설 전체 조회 )
아래는 샘플
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