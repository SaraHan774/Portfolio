# NETWORK.md: 네트워크 I/O 효율화

## 1. API 설계

### 1.1 REST API 설계 원칙

```typescript
// ✅ 좋은 API 설계
GET    /api/wines              // 목록 조회 (페이징)
GET    /api/wines/:id          // 상세 조회
POST   /api/wines              // 생성
PUT    /api/wines/:id          // 전체 수정
PATCH  /api/wines/:id          // 부분 수정
DELETE /api/wines/:id          // 삭제

// 쿼리 파라미터
GET /api/wines?page=1&limit=20&sort=name&type=red

// 응답 구조
{
  success: true,
  data: { ... },
  error: null,
  meta: {
    timestamp: "2024-01-15T10:30:00Z",
    version: "1.0"
  }
}
```

### 1.2 GraphQL로 필요한 데이터만 요청

```typescript
// ❌ REST: 불필요한 필드까지 받음
GET /api/users/123      // name, email, avatar, bio, ...
GET /api/users/123/posts // id, title, content, likes, ...

// ✅ GraphQL: 필요한 필드만
query GetUserWithPosts($id: ID!) {
  user(id: $id) {
    id
    name
    posts {
      id
      title
    }
  }
}
```

## 2. 요청 최적화

### 2.1 배치 요청

```typescript
// ❌ 나쁜 예: N+1 문제 (여러 API 호출)
const userIds = ['1', '2', '3', '4', '5'];
userIds.forEach(id => {
  fetchUser(id); // 5번의 API 호출 + 네트워크 오버헤드
});

// ✅ 좋은 예: 배치 요청
async function getUsersBatch(userIds: string[]): Promise<User[]> {
  const response = await apiClient.post('/api/users/batch', {
    ids: userIds,
  });
  return response.data;
}

// 또는 병렬 요청 (동시성 제한)
async function getUsersParallel(
  userIds: string[],
  maxConcurrent = 5
): Promise<User[]> {
  const results: User[] = [];
  
  for (let i = 0; i < userIds.length; i += maxConcurrent) {
    const batch = userIds.slice(i, i + maxConcurrent);
    const users = await Promise.all(
      batch.map(id => userRepository.getById(id))
    );
    results.push(...users);
  }
  
  return results;
}
```

### 2.2 요청 중복 제거 (Deduplication)

```typescript
// ✅ React Query가 자동으로 처리
// queryKey가 같으면 동시 요청을 1번으로 통합

function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => userRepository.getById(userId),
  });
}

// 여러 곳에서 동시에 호출해도 API는 1번만 호출됨
const user1 = useUser('123'); // API 호출
const user2 = useUser('123'); // 캐시 사용
const user3 = useUser('123'); // 캐시 사용

// 명시적 중복 제거
const requestCache = new Map<string, Promise<any>>();

async function fetchWithDedup<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!;
  }

  const promise = fetcher();
  requestCache.set(key, promise);

  try {
    return await promise;
  } finally {
    // 요청 완료 후 캐시 제거
    requestCache.delete(key);
  }
}
```

### 2.3 Request/Response 압축

```typescript
// ✅ Axios 설정 (gzip 자동)
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 5000,
  headers: {
    'Accept-Encoding': 'gzip, deflate', // 자동으로 처리됨
  },
});

// 서버에서도 설정:
// Content-Encoding: gzip
```

### 2.4 요청 취소 (중복/불필요한 요청)

```typescript
// ✅ 컴포넌트 언마운트 시 요청 취소
function useUserSearch(query: string) {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (query) {
      fetchUsers(query, abortController.signal)
        .then(setResults)
        .catch(err => {
          if (err.name !== 'AbortError') {
            setError(err);
          }
        });
    }

    return () => abortController.abort(); // 언마운트 시 취소
  }, [query]);

  return results;
}

// React Query에서는 자동 처리됨
```

## 3. 캐싱 전략

### 3.1 HTTP 캐시 헤더

```typescript
// 서버 응답 헤더
Cache-Control: public, max-age=3600              // 1시간
Cache-Control: private, max-age=1800             // 비공개, 30분
Cache-Control: no-cache, must-revalidate        // 매번 검증
Cache-Control: no-store                          // 캐싱 금지

// React Query와 함께
const query = useQuery({
  queryKey: ['wines'],
  queryFn: () => wineRepository.getAll(),
  staleTime: 60 * 1000,      // 60초: 캐시 재검증 안 함
  gcTime: 5 * 60 * 1000,     // 5분: 메모리 유지
});
```

### 3.2 로컬 스토리지 캐싱

```typescript
// ✅ 간단한 캐시 매니저
const cacheManager = {
  set<T>(key: string, value: T, ttl: number) {
    localStorage.setItem(
      key,
      JSON.stringify({
        value,
        expiresAt: Date.now() + ttl,
      })
    );
  },

  get<T>(key: string): T | null {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  },

  remove(key: string) {
    localStorage.removeItem(key);
  },
};

// 사용
cacheManager.set('wines', winesData, 5 * 60 * 1000);
const cached = cacheManager.get('wines');
```

### 3.3 IndexedDB (큰 데이터)

```typescript
// ✅ 대량 데이터는 IndexedDB 사용
import Dexie from 'dexie';

class WineDatabase extends Dexie {
  wines!: Dexie.Table<Wine, number>;

  constructor() {
    super('WineDB');
    this.version(1).stores({
      wines: '++id, type, vintage',
    });
  }
}

const db = new WineDatabase();

// 저장
await db.wines.bulkAdd(winesData);

// 조회
const reds = await db.wines
  .where('type')
  .equals('red')
  .toArray();

// 업데이트
await db.wines.update(1, { rating: 8.5 });
```

## 4. 실시간 통신

### 4.1 WebSocket (양방향)

```typescript
// ✅ 실시간 채팅, 알림 등
function useRealtimeMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(
      `wss://${import.meta.env.VITE_API_HOST}/messages/${roomId}`
    );

    ws.onopen = () => {
      console.log('Connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, message]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId]);

  return messages;
}
```

### 4.2 Server-Sent Events (SSE)

```typescript
// ✅ 서버에서 클라이언트로 단방향 스트리밍
function useServerEvents(eventType: string) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/events?type=${eventType}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setEvents(prev => [...prev, data]);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => eventSource.close();
  }, [eventType]);

  return events;
}
```

### 4.3 폴링 (최후의 수단)

```typescript
// ❌ 나쁜 예: 과도한 폴링
setInterval(() => {
  fetchLatestMessages(); // 매초 요청 (매우 비효율)
}, 1000);

// ✅ 적절한 폴링
function useAdaptivePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 5000
) {
  const [data, setData] = useState<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await fetcher();
        setData(result);
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    poll(); // 즉시 첫 요청

    timerRef.current = setInterval(poll, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetcher, interval]);

  return data;
}

// 사용
const latestWines = useAdaptivePolling(
  () => wineRepository.getLatest(),
  30 * 1000 // 30초마다
);
```

## 5. 오류 처리 및 재시도

### 5.1 Exponential Backoff

```typescript
// ✅ 실패 시 점진적으로 대기 시간 증가
async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetcher();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // 지수 백오프: 1s, 2s, 4s, 8s ...
      const delay = Math.min(
        1000 * Math.pow(2, attempt),
        30000 // 최대 30초
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// React Query에서는 자동 처리됨
const query = useQuery({
  queryKey: ['wines'],
  queryFn: () => wineRepository.getAll(),
  retry: 3,
  retryDelay: (attemptIndex) =>
    Math.min(1000 * Math.pow(2, attemptIndex), 30000),
});
```

### 5.2 Circuit Breaker 패턴

```typescript
// ✅ 반복된 실패 시 요청 중단
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > 60000) {
        // 1분 후 HALF_OPEN으로 시도
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
    }
  }
}

const breaker = new CircuitBreaker();
const data = await breaker.execute(() => fetchWines());
```

## 6. 네트워크 상태 감지

```typescript
// ✅ 온라인/오프라인 감지
function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' && navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// 사용
function App() {
  const isOnline = useNetworkStatus();

  if (!isOnline) {
    return <OfflinePage />;
  }

  return <MainApp />;
}
```

## 체크리스트

네트워크 효율화:

- [ ] GraphQL 검토 (불필요한 필드 제거 가능한지)
- [ ] 배치 요청 구현 (N+1 문제)
- [ ] React Query 캐싱 설정
- [ ] 요청 중복 제거 확인
- [ ] gzip 압축 활성화
- [ ] WebSocket 사용 (실시간 필요할 때)
- [ ] Circuit breaker 패턴 (중요 API)
- [ ] 오프라인 대응 검토

---

**더 보기**: `docs/SECURITY.md`, `docs/PERFORMANCE.md`
