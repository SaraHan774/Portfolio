# Layout Debug Logging 가이드

Window resize, 페이지 reload 시 발생하는 레이아웃 문제를 디버깅하기 위한 로깅 시스템입니다.

## 🎯 목적

- MediaTimeline 위치 깨짐
- 작업 캡션 위치 깨짐
- 카테고리 영역 침범 현상

위 문제들을 추적하기 위해 모든 측정값과 계산 과정을 로그로 기록합니다.

## 📊 로깅되는 컴포넌트

### 1. **PortfolioLayout**
- 컴포넌트 mount/unmount (breakpoint 포함)
- Window resize 이벤트 (150ms debounced)
- **Breakpoint 변경 감지** (xs/sm/md/lg/xl/2xl)
  - xs: 0 ~ 480px
  - sm: 481px ~ 600px
  - md: 601px ~ 767px
  - lg: 768px ~ 1024px
  - xl: 1025px ~ 1280px
  - 2xl: 1281px+
- 카테고리 높이 변경 (sentence/exhibition)
- WorkListScroller 높이 변경 (left/right)
- contentPaddingTop 계산
- workListConfig 계산

### 2. **CaptionWithBoundary**
- 컴포넌트 mount/unmount
- 캡션 위치 계산 (scroll/resize 시)
- 미디어 컨테이너 위치 추적

### 3. **MediaTimeline**
- 컴포넌트 mount/unmount
- 미디어 bounds 계산 (page/modal 모드)
- 첫 번째/마지막 미디어 element 위치

## 🚀 사용 방법

### 1. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 페이지를 열면 자동으로 로깅이 시작됩니다.

### 2. 브라우저 콘솔 확인

개발자 도구(F12)를 열고 Console 탭에서 로그를 확인할 수 있습니다:

- 🎬 = mount/unmount
- 📏 = resize
- 📜 = scroll
- 🔄 = update
- 🧮 = calculate
- 📐 = measure

각 로그는 컴포넌트별로 색상이 다르게 표시됩니다:
- **PortfolioLayout** = 파란색
- **CaptionWithBoundary** = 초록색
- **MediaTimeline** = 주황색

### 3. 테스트 시나리오

아래 작업들을 수행하면서 로그를 확인하세요:

1. **Window resize**
   - 브라우저 창 크기를 드래그해서 변경
   - 최소화/최대화 반복
   - 개발자 도구 열기/닫기 (뷰포트 크기 변경됨)

2. **페이지 reload**
   - F5 또는 Cmd+R
   - Hard reload: Cmd+Shift+R

3. **카테고리 전환**
   - 좌측/우측 카테고리 전환
   - 작품 목록 클릭

4. **스크롤**
   - 페이지 스크롤
   - 빠르게 스크롤

### 4. 로그 내보내기

문제가 재현되었을 때 콘솔에 다음 명령어를 입력:

```javascript
window.__EXPORT_LAYOUT_LOGS__()
```

이 명령어는:
- 콘솔에 전체 로그를 JSON 형태로 출력
- 자동으로 클립보드에 복사
- 총 로그 개수를 표시

### 5. 로그 삭제

로그를 초기화하려면:

```javascript
window.__CLEAR_LAYOUT_LOGS__()
```

## 📋 로그 데이터 구조

각 로그는 다음 정보를 포함합니다:

```json
{
  "timestamp": 1704067200000,
  "timeString": "2024-01-01T00:00:00.000Z",
  "component": "PortfolioLayout",
  "event": "windowResize",
  "data": {
    "windowWidth": 1920,
    "windowHeight": 1080,
    "scrollY": 500,
    "scrollX": 0,
    "documentHeight": 3000,
    "documentWidth": 1920,
    "pathname": "/works/some-work-id",
    "sentenceCategoryHeight": 150,
    "exhibitionCategoryHeight": 0,
    "workListScrollerHeight": 80,
    "contentPaddingTop": "318px"
  }
}
```

## 🔍 문제 분석 방법

### 1. Timeline 분석

로그를 시간순으로 정렬하여 어떤 순서로 이벤트가 발생했는지 확인:

```javascript
// 최근 10개 로그 확인
console.table(window.__LAYOUT_DEBUG_LOGS__.slice(-10))
```

### 2. 특정 컴포넌트만 필터링

```javascript
// PortfolioLayout 로그만
const layoutLogs = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
  log.component === 'PortfolioLayout'
);
console.table(layoutLogs);
```

### 3. Resize 이벤트만 필터링

```javascript
// Resize 관련 로그만
const resizeLogs = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
  log.event.includes('resize') || log.event.includes('Resize')
);
console.table(resizeLogs);
```

### 4. 특정 시간대 로그 확인

```javascript
// 최근 5초간의 로그
const now = Date.now();
const recentLogs = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
  log.timestamp > now - 5000
);
console.table(recentLogs);
```

### 5. Breakpoint 변경 추적

```javascript
// Breakpoint 변경 이벤트만 필터링
const breakpointChanges = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
  log.event === 'breakpointChange'
);
console.table(breakpointChanges);

// 특정 breakpoint로 전환된 경우 찾기
const toMobile = breakpointChanges.filter(log =>
  log.data.breakpoint_to === 'xs' || log.data.breakpoint_to === 'sm'
);

// 가장 최근 breakpoint 변경
const lastBreakpointChange = breakpointChanges[breakpointChanges.length - 1];
console.log('Last breakpoint change:', lastBreakpointChange);
```

### 6. Padding 값 변화 분석 (Breakpoint별)

```javascript
// Breakpoint별로 contentPaddingTop 값 추적
function trackPaddingByBreakpoint() {
  const logs = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
    log.event === 'windowResize' && log.data.breakpoint
  );

  const paddingByBreakpoint = {};
  logs.forEach(log => {
    const bp = log.data.breakpoint;
    const padding = log.data.contentPaddingTop;

    if (!paddingByBreakpoint[bp]) {
      paddingByBreakpoint[bp] = [];
    }
    paddingByBreakpoint[bp].push({
      time: log.timeString,
      padding: padding,
      width: log.data.windowWidth
    });
  });

  return paddingByBreakpoint;
}

// 실행
console.table(trackPaddingByBreakpoint());
```

## ⚠️ 주의사항

### 성능 영향

- 이 로깅 시스템은 **개발 모드 전용**입니다
- 프로덕션 빌드에서는 자동으로 비활성화됩니다
- 로그가 많이 쌓이면 메모리 사용량이 증가할 수 있습니다
- 주기적으로 `window.__CLEAR_LAYOUT_LOGS__()`로 로그를 삭제하세요

### 로그 공유

로그를 공유할 때:

1. `window.__EXPORT_LAYOUT_LOGS__()` 실행
2. 클립보드에 복사된 JSON을 파일로 저장
3. GitHub Issue 또는 슬랙에 첨부

## 🎓 고급 활용

### 커스텀 필터 함수

```javascript
// 카테고리 높이가 변경된 로그만
function findCategoryHeightChanges() {
  return window.__LAYOUT_DEBUG_LOGS__.filter(log =>
    log.event.includes('CategoryHeightChange')
  );
}

// contentPaddingTop이 0px인 경우 찾기
function findZeroPadding() {
  return window.__LAYOUT_DEBUG_LOGS__.filter(log =>
    log.data.contentPaddingTop === '0px' ||
    log.data.result === '0px'
  );
}

// WorkList 위치 변경 추적
function trackWorkListPosition() {
  return window.__LAYOUT_DEBUG_LOGS__
    .filter(log => log.component === 'PortfolioLayout')
    .filter(log => log.event.includes('workListScroller'))
    .map(log => ({
      time: log.timeString,
      position: log.data.position,
      height: log.data.workListHeight,
      top: log.data.workListTop
    }));
}
```

### 변화 감지

```javascript
// contentPaddingTop 값의 변화 추적
function trackPaddingChanges() {
  const logs = window.__LAYOUT_DEBUG_LOGS__.filter(log =>
    log.event === 'contentPaddingTopCalculate'
  );

  let previous = null;
  const changes = [];

  logs.forEach(log => {
    const current = log.data.result;
    if (previous !== null && previous !== current) {
      changes.push({
        time: log.timeString,
        from: previous,
        to: current,
        reason: log.data.reason
      });
    }
    previous = current;
  });

  return changes;
}
```

## 📞 문제 보고 시 포함할 정보

버그를 보고할 때 다음 정보를 함께 제공하세요:

1. **재현 단계**
   - 어떤 작업을 했는지 (resize, reload, 카테고리 변경 등)

2. **로그 JSON**
   - `window.__EXPORT_LAYOUT_LOGS__()` 결과

3. **스크린샷**
   - 문제가 발생한 화면

4. **환경 정보**
   - 브라우저 (Chrome, Safari, Firefox 등)
   - 화면 크기 (로그에 포함되어 있음)
   - OS (Mac, Windows 등)

## 🛠️ 트러블슈팅

### 로그가 보이지 않는 경우

```javascript
// 로깅 시스템이 초기화되었는지 확인
console.log(window.__LAYOUT_DEBUG_LOGS__);

// 없으면 페이지 새로고침
```

### 로그가 너무 많은 경우

```javascript
// 로그 개수 확인
console.log(`Total logs: ${window.__LAYOUT_DEBUG_LOGS__.length}`);

// 오래된 로그 삭제 (최근 100개만 유지)
window.__LAYOUT_DEBUG_LOGS__ = window.__LAYOUT_DEBUG_LOGS__.slice(-100);
```

---

**버전**: 1.0
**작성일**: 2026-01-01
