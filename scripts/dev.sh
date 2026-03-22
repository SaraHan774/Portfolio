#!/usr/bin/env bash
# dev.sh — 테스트 환경 원클릭 시작 스크립트
# 실행: bash scripts/dev.sh
# Firebase Emulator + Admin(dev:emulator) + Front(dev:emulator) 동시 시작 후
# Front 앱이 준비되면 Chrome & Safari로 자동 오픈

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONT_PORT=3000
FRONT_URL="http://localhost:${FRONT_PORT}"
ADMIN_URL="http://localhost:5173"
EMULATOR_UI_URL="http://localhost:4000"

# PID 변수 초기화 (cleanup에서 unbound 에러 방지)
EMULATOR_PID=""
ADMIN_PID=""
FRONT_PID=""

cleanup() {
  echo ""
  echo ">>> 종료 중..."

  # Admin, Front 먼저 종료
  [ -n "$ADMIN_PID" ] && kill "$ADMIN_PID" 2>/dev/null || true
  [ -n "$FRONT_PID" ] && kill "$FRONT_PID" 2>/dev/null || true

  # Emulator는 SIGTERM으로 graceful shutdown → --export-on-exit 데이터 저장
  if [ -n "$EMULATOR_PID" ]; then
    echo ">>> Emulator 데이터 저장 중... (잠시 기다려주세요)"
    kill "$EMULATOR_PID" 2>/dev/null || true
    wait "$EMULATOR_PID" 2>/dev/null || true
    echo ">>> Emulator 데이터 저장 완료 (admin/emulator-data/)"
  fi
}
trap cleanup INT TERM EXIT

echo "=== 테스트 환경 시작 ==="
echo "ROOT: ${ROOT_DIR}"
echo ""

# 1) Firebase Emulator (백그라운드)
echo ">>> [1/3] Firebase Emulator 시작..."
(cd "${ROOT_DIR}" && firebase emulators:start \
  --project portfolio-nhb \
  --import=./admin/emulator-data \
  --export-on-exit=./admin/emulator-data) &
EMULATOR_PID=$!

# 2) Admin dev server (에뮬레이터 모드, 백그라운드)
echo ">>> [2/3] Admin 앱 시작 (port 5173)..."
(cd "${ROOT_DIR}/admin" && npm run dev:emulator) &
ADMIN_PID=$!

# 3) Front dev server (에뮬레이터 모드, 백그라운드)
echo ">>> [3/3] Front 앱 시작 (port ${FRONT_PORT})..."
(cd "${ROOT_DIR}/front" && npm run dev:emulator) &
FRONT_PID=$!

# Emulator UI가 준비될 때까지 대기 후 Chrome으로 오픈
echo ""
echo ">>> Emulator UI 준비 대기 중 (${EMULATOR_UI_URL})..."
until curl -s -o /dev/null "${EMULATOR_UI_URL}"; do
  sleep 1
done
echo ">>> Emulator UI 준비 완료!"
echo ">>> Emulator UI Chrome으로 오픈..."
open -a "Google Chrome" "${EMULATOR_UI_URL}"

# Admin 서버가 준비될 때까지 대기 후 Chrome으로 오픈
echo ""
echo ">>> Admin 서버 준비 대기 중 (${ADMIN_URL})..."
until curl -s -o /dev/null "${ADMIN_URL}"; do
  sleep 1
done
echo ">>> Admin 서버 준비 완료!"
echo ">>> Admin Chrome으로 오픈..."
open -a "Google Chrome" "${ADMIN_URL}"

# Front 서버가 준비될 때까지 대기
echo ""
echo ">>> Front 서버 준비 대기 중 (${FRONT_URL})..."
until curl -s -o /dev/null "${FRONT_URL}"; do
  sleep 1
done
echo ">>> Front 서버 준비 완료!"

# Chrome & Safari로 오픈
echo ">>> Front Chrome으로 오픈..."
open -a "Google Chrome" "${FRONT_URL}"

echo ">>> Front Safari로 오픈..."
open -a "Safari" "${FRONT_URL}"

echo ""
echo "=== 모든 서비스 실행 중 ==="
echo "  Firebase Emulator UI : http://localhost:4000"
echo "  Admin                : http://localhost:5173"
echo "  Front                : ${FRONT_URL}"
echo ""
echo "종료하려면 Ctrl+C 를 누르세요."

# 자식 프로세스가 살아있는 동안 대기
wait
