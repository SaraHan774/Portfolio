/**
 * 프론트(Next.js) ISR 셸 on-demand 재검증 트리거.
 *
 * admin에서 카테고리/사이트설정/작품을 발행·수정·삭제한 뒤 호출하면, 엣지에 캐시된 '/'가
 * 즉시 무효화되어 변경이 바로 반영된다("엣지 캐시로 빠름 + 변경 즉시 반영").
 *
 * - env(VITE_FRONT_REVALIDATE_URL, VITE_REVALIDATE_SECRET) 미설정 시 **no-op**(graceful).
 * - 실패해도 throw하지 않는다. 본 작업(저장)은 이미 성공했고, 프론트엔 안전망 revalidate(5분)가
 *   있으므로 재검증 실패가 admin UX를 막지 않는다. fire-and-forget으로 호출한다.
 */
export async function triggerFrontRevalidation(): Promise<void> {
  const url = import.meta.env.VITE_FRONT_REVALIDATE_URL;
  const secret = import.meta.env.VITE_REVALIDATE_SECRET;
  if (!url || !secret) return;

  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ path: '/' }),
      keepalive: true,
    });
  } catch {
    // 재검증 실패는 무시(안전망 revalidate가 5분 내 갱신).
  }
}
