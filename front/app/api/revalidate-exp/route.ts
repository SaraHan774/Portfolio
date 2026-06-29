/**
 * On-demand revalidation 핸들러 (실험용).
 * admin에서 작품/카테고리 발행 시 이런 엔드포인트를 호출하면, ISR 캐시를 즉시 무효화해
 * "캐시로 빠름 + 변경 즉시 반영"을 동시에 달성한다(force-dynamic 없이 신선도 확보).
 *
 * 사용: POST /api/revalidate-exp
 */
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
  revalidatePath('/isr-exp/isr');
  return NextResponse.json({ revalidated: true, at: Date.now() });
}
