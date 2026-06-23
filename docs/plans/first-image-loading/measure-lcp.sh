#!/usr/bin/env bash
# 첫 이미지 로딩 벤치마크 측정 하네스
#
# 같은 URL을 Lighthouse(mobile)로 N회 돌려 LCP와 그 단계 분해(TTFB/Load Delay/
# Load Time/Render Delay)의 "중앙값"을 뽑는다. 각 plan 적용 전/후를 동일 조건으로
# 비교하기 위한 기준 측정기.
#
# 사용법:
#   ./measure-lcp.sh <URL> <LABEL> [RUNS]
# 예:
#   ./measure-lcp.sh "https://hyebinna.com/?exhibitionId=6YOWXaVDmK54vzBZph7H&workId=9Ehrmcpebh5mZwRv8qGF" baseline 5
#
# 출력: ./lh-runs/<LABEL>/ 에 run-*.json 저장 + 중앙값 요약을 stdout/summary.txt 로.
#
# 주의(캐시 상태):
#   - Load Delay 는 클라이언트 워터폴 지표라 캐시와 무관 → plan ①②③ 의 1차 KPI.
#   - Load Time 은 /_next/image 엣지 캐시 워밍 여부에 크게 좌우됨 → cold/warm 을
#     라벨로 구분해 측정할 것(예: baseline-cold / baseline-warm).
set -euo pipefail

URL="${1:?URL 필요}"
LABEL="${2:?LABEL 필요}"
RUNS="${3:-5}"

OUTDIR="$(dirname "$0")/lh-runs/$LABEL"
mkdir -p "$OUTDIR"

echo "▶ measuring '$LABEL' : $RUNS runs (mobile)"
for i in $(seq 1 "$RUNS"); do
  echo "  run $i/$RUNS ..."
  npx --yes lighthouse "$URL" \
    --only-categories=performance \
    --form-factor=mobile \
    --output=json \
    --output-path="$OUTDIR/run-$i.json" \
    --chrome-flags="--headless=new" \
    --quiet >/dev/null 2>&1 || { echo "  run $i 실패"; continue; }
done

echo "▶ aggregating medians ..."
jq -s '
  def median(arr): (arr|sort) as $s | ($s|length) as $n
    | if $n==0 then 0 elif ($n%2==1) then $s[($n/2|floor)] else (($s[$n/2-1]+$s[$n/2])/2) end;
  def lcpPhase($p): map(.audits["largest-contentful-paint-element"].details.items[1].items[]?
      | select(.phase==$p) | .timing) ;
  {
    label: "'"$LABEL"'",
    runs: length,
    perfScore_median: (median([.[].categories.performance.score]) * 100 | floor),
    FCP_ms_median:    (median([.[].audits["first-contentful-paint"].numericValue]) | floor),
    LCP_ms_median:    (median([.[].audits["largest-contentful-paint"].numericValue]) | floor),
    SI_ms_median:     (median([.[].audits["speed-index"].numericValue]) | floor),
    TBT_ms_median:    (median([.[].audits["total-blocking-time"].numericValue]) | floor),
    LCP_TTFB_median:        (median(lcpPhase("TTFB")) | floor),
    LCP_LoadDelay_median:   (median(lcpPhase("Load Delay")) | floor),
    LCP_LoadTime_median:    (median(lcpPhase("Load Time")) | floor),
    LCP_RenderDelay_median: (median(lcpPhase("Render Delay")) | floor)
  }
' "$OUTDIR"/run-*.json | tee "$OUTDIR/summary.json"

echo "✔ saved → $OUTDIR/summary.json"
