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