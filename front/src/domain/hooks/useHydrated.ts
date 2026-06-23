import { useSyncExternalStore } from 'react';

/**
 * 클라이언트 하이드레이션 완료 여부를 반환하는 hook
 *
 * SSR(서버 렌더링) 시에는 `false`, 클라이언트 하이드레이션 이후에는 `true`를 반환한다.
 * `useEffect` 내부에서 `setState`를 호출하는 마운트 감지 패턴(react-hooks/set-state-in-effect
 * 규칙 위반)을 대체하기 위해 `useSyncExternalStore`를 사용한다.
 *
 * - getSnapshot(client): 항상 `true`
 * - getServerSnapshot(server): 항상 `false`
 *
 * 외부 스토어 구독은 변경 알림이 필요 없으므로 no-op 구독을 사용한다.
 */
const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydrated(): boolean {
  return useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
}
