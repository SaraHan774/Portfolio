# 첫 이미지 로딩 체감 개선 — 계획 묶음

> 목표: 상세 화면에서 **첫 이미지가 뜨는 체감 속도** 개선
> 작성일: 2026-06-23
> 진행 방식: 계획서별로 **하나씩 구현 → 검증(Lighthouse/수동) → 다음**

## 배경: 현재 워터폴

상세 화면은 SPA(`?workId=`) + 클라이언트 전용 Firebase SDK 구조라, 첫 이미지까지 다음 직렬 경로를 탄다.

```
HTML → JS 번들 → 하이드레이션 → useWork() React Query → Firestore getDoc()
→ 그제서야 image.url 확보 → /_next/image 요청 → AVIF 변환 → 다운로드 → 표시
```

`force-dynamic`이지만 상세 데이터는 클라이언트에서 받으므로, Next가 `priority` 이미지에 자동으로 넣는 `<link rel="preload" as="image">`가 **HTML에 들어가지 못한다**(서버가 URL을 모름). 즉 priority가 사실상 무력.

## 4가지 개선 방식 비교

| # | 방식 | 첫 이미지 체감 | 디자인 변화 | Firebase Storage 추가 비용 | 난이도 |
|---|------|------|------|------|------|
| 1 | **데이터 prefetch 보강** | 중간 | 없음 | ~0 (Firestore read) | 낮음 |
| 2 | **SSR/preload** | 큼 (워터폴 제거) | 없음 | 0 | 높음 |
| 3 | **이미지 prefetch** | 가장 큼 | 없음 | 콜드 미스분만 (제어 가능) | 중간 |
| 4 | **LQIP 블러** | 큼 (0ms 형상) | **있음** (열화 이미지 노출) | 0 | 중간 |

> 핵심: 프로덕션은 `/_next/image` 엣지 캐시(`minimumCacheTTL` 31일)가 앞단에 있어, 이미지 바이트를 여러 번 당겨도 **Firebase Storage egress는 콜드 미스 1회**만 발생. 따라서 3번의 실제 Storage 부담은 "아무도 안 받은 새 변형"에 한정.

## 권장 구현 순서

디자인 유지 + 비용 0을 우선하고, 쉬운 것부터 워밍업해 큰 것으로:

1. **[데이터 prefetch 보강](./01-data-prefetch.md)** — 비용·디자인·위험 모두 최저. 캡션/모바일 경로의 누락된 prefetch를 채워 워터폴의 "데이터 leg"를 클릭 전에 끝낸다.
2. **[SSR/preload](./02-ssr-preload.md)** — 효과 가장 근본적. 서버에서 첫 이미지 URL을 확보해 `<link rel="preload" as="image">`를 HTML에 주입, 워터폴의 JS·하이드레이션·쿼리 구간을 첫 이미지에서 제거.
3. **[이미지 prefetch](./03-image-prefetch.md)** — 강한 인텐트 + 첫 1장으로 제한해 비용을 통제하며 클릭 후 거의 즉시 표시.
4. **[LQIP 블러](../lqip-blur-placeholder.md)** — 디자인 방향(열화 이미지 노출 허용)을 바꾸기로 결정한 경우에만. 절충안으로 "단색 플레이스홀더" 검토.

각 단계는 독립적으로 켜고 끌 수 있으며, 효과는 상호 배타가 아니라 **누적**된다.

## 검증 / 벤치마크 (공통)

측정 방법·베이스라인·plan별 합격 기준은 **[BENCHMARKS.md](./BENCHMARKS.md)** 에 정량 정의.
재현 측정기는 **[`measure-lcp.sh`](./measure-lcp.sh)** (Lighthouse mobile, 5회 중앙값).

- 핵심 지표: **LCP + 단계 분해**(TTFB / Load Delay / Load Time / Render Delay).
  - LCP 요소 = 첫 상세 이미지 `<img>`(확인됨). Load Delay = CSR 워터폴 구간.
- 각 plan은 BENCHMARKS §4의 **pass gate를 5회 중앙값으로 충족**해야 완료.
- 착수 전 cold/warm 베이스라인을 `measure-lcp.sh`로 재고정(step 0).
```
