/**
 * 실험 baseline: force-dynamic (현재 앱과 동일한 렌더 전략).
 * 매 요청 Firebase에서 카테고리를 읽고 서버에서 렌더 → 엣지 캐시 없음.
 */
export const dynamic = 'force-dynamic';

async function countCategories(collection: string): Promise<number> {
  const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const t0 = Date.now();
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${collection}?key=${key}&pageSize=300`,
    { cache: 'no-store' }
  );
  const json = await res.json();
  const n = (json.documents ?? []).length;
  console.log(`[isr-exp:dynamic] read ${collection} -> ${n} docs in ${Date.now() - t0}ms`);
  return n;
}

export default async function DynamicExpPage() {
  const [sentence, exhibition] = await Promise.all([
    countCategories('sentenceCategories'),
    countCategories('exhibitionCategories'),
  ]);
  return (
    <main style={{ padding: 24, fontFamily: 'monospace' }}>
      <h1>DYNAMIC (force-dynamic)</h1>
      <p>sentence={sentence} / exhibition={exhibition}</p>
      <p>renderedAt={Date.now()}</p>
    </main>
  );
}
