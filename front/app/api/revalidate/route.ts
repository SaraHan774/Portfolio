/**
 * On-demand revalidation 엔드포인트.
 *
 * admin에서 카테고리/사이트설정/작품을 발행·수정·삭제하면 이 엔드포인트를 호출해
 * ISR로 캐시된 셸('/')을 즉시 무효화한다 → "엣지 캐시로 빠름 + 변경 즉시 반영".
 *
 * 보안: `x-revalidate-secret` 헤더를 서버 env `REVALIDATE_SECRET`과 비교.
 *       시크릿이 설정돼 있지 않으면 비활성(503).
 * CORS: admin은 다른 오리진(Firebase Hosting)이므로 허용 헤더를 둔다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const allowOrigin = process.env.ADMIN_ORIGIN ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-revalidate-secret',
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { revalidated: false, reason: 'not-configured' },
      { status: 503, headers: corsHeaders }
    );
  }
  if (request.headers.get('x-revalidate-secret') !== secret) {
    return NextResponse.json(
      { revalidated: false, reason: 'unauthorized' },
      { status: 401, headers: corsHeaders }
    );
  }

  // 본문의 path가 있으면 그 경로를, 없으면 셸('/')을 무효화.
  let path = '/';
  try {
    const body = (await request.json()) as { path?: unknown };
    if (typeof body?.path === 'string' && body.path.startsWith('/')) {
      path = body.path;
    }
  } catch {
    // 본문 없음/파싱 실패 → 기본 '/'
  }

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path }, { headers: corsHeaders });
}
