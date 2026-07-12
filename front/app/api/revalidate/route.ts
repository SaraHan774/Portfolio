/**
 * On-demand revalidation 엔드포인트.
 *
 * admin에서 셸에 담기는 콘텐츠(카테고리·사이트설정)를 발행·수정·삭제하면 이 엔드포인트를
 * 호출해 ISR로 캐시된 셸('/')을 즉시 무효화한다 → "엣지 캐시로 빠름 + 변경 즉시 반영".
 * (작품은 CSR이라 셸 캐시와 무관 → 재검증 대상 아님)
 *
 * 보안: `x-revalidate-secret` 헤더를 서버 env `REVALIDATE_SECRET`과 비교.
 *       시크릿이 설정돼 있지 않으면 비활성(503).
 * CORS: admin은 다른 오리진(Firebase Hosting)이므로 허용 헤더를 둔다.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { timingSafeEqual } from 'node:crypto';

// node:crypto(timingSafeEqual)를 쓰므로 Node 런타임을 명시한다.
export const runtime = 'nodejs';

// ADMIN_ORIGIN 미설정 시 '*'로 동작하지만, 실제 보호는 시크릿 + 아래 디바운스로 한다.
// 프로덕션에선 ADMIN_ORIGIN을 admin 호스팅 오리진으로 지정해 CORS를 좁히길 권장.
const allowOrigin = process.env.ADMIN_ORIGIN ?? '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': allowOrigin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-revalidate-secret',
};

/**
 * 타이밍 세이프 비교. 단순 `!==`는 첫 불일치 바이트에서 단락되어 타이밍 사이드채널로
 * 시크릿을 추정당할 수 있으므로 상수시간 비교를 쓴다. (길이 불일치는 즉시 false)
 */
function isSecretValid(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// 서버측 디바운스(캐시 스탬피드/스팸 방지).
// 시크릿은 admin 클라이언트 번들에 노출되므로 사실상 공개값 → 무제한 호출 시 매번
// revalidatePath로 셸 재생성을 강제해 ISR 이득을 무력화(+Firebase read 비용)할 수 있다.
// revalidatePath는 멱등이므로 짧은 창 내 호출은 1회로 합친다. 놓친 변경은 layout의
// revalidate=300 안전망이 커버한다. (서버리스 인스턴스 로컬 — 단일 인스턴스 스팸 루프 완화)
//
// 창을 1s로 둔 이유: 단일 저장이 동기적으로 여러 mutation을 발생시키는 버스트(예: 폼 저장
// 시 카테고리+설정 동시 변경, 대량 복원)는 여전히 1회로 합치되, 사용자가 초 단위로 잇따라
// 수동 편집하는 경우엔 각 변경이 곧바로 반영되도록 신선도를 우선한다.
const REVALIDATE_MIN_INTERVAL_MS = 1000;
let lastRevalidateAt = 0;

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
  if (!isSecretValid(request.headers.get('x-revalidate-secret'), secret)) {
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

  // 디바운스 창 내 중복 호출은 실제 재검증 없이 합친다(스탬피드 방지).
  const now = Date.now();
  if (now - lastRevalidateAt < REVALIDATE_MIN_INTERVAL_MS) {
    return NextResponse.json(
      { revalidated: true, coalesced: true, path },
      { headers: corsHeaders }
    );
  }
  lastRevalidateAt = now;

  revalidatePath(path);
  return NextResponse.json({ revalidated: true, path }, { headers: corsHeaders });
}
