/**
 * 실험: ISR (revalidate 60s).
 * 빌드/재검증 시점에만 Firebase를 읽어 HTML을 캐시하고, 그 사이 요청은 캐시된 HTML을
 * 즉시 반환(서버 렌더·Firebase 읽기 없음). 프로덕션에선 이 캐시 HTML이 사용자와 가까운
 * 엣지(서울)에서 서빙되어 미국 함수 왕복이 사라진다.
 * 신선도는 on-demand revalidation(/api/revalidate-exp)으로 즉시 갱신.
 */
export const revalidate = 60;

async function countCategories(collection: string): Promise<number> {
  const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const t0 = Date.now();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${collection}?key=${key}&pageSize=300`,
    { next: { revalidate: 60 } }
  );
  const json = await res.json();
  const n = (json.documents ?? []).length;
  console.log(`[isr-exp:isr] read ${collection} -> ${n} docs in ${Date.now() - t0}ms`);
  return n;
}

export default async function IsrExpPage() {
  const [sentence, exhibition] = await Promise.all([
    countCategories('sentenceCategories'),
    countCategories('exhibitionCategories'),
  ]);
  return (
    <main style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>ISR (revalidate=60)</h1>
      <p>sentence={sentence} / exhibition={exhibition}</p>
      <p>renderedAt={Date.now()}</p>
    </main>
  );
}
