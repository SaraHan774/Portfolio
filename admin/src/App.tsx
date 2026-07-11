import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { triggerFrontRevalidation } from './data/api/revalidate';
import { ConfigProvider, Spin, App as AntdApp } from 'antd';
import koKR from 'antd/locale/ko_KR';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorksList from './pages/WorksList';
import WorkForm from './pages/WorkForm';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import { useAuthStore } from './state';
import './App.css';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  // 프론트 ISR 셸(카테고리 + 사이트설정)에 영향을 주는 mutation만 on-demand 재검증한다.
  // 셸에 없는 mutation(이미지 업로드/백업/권한 등)까지 매번 재검증하면 불필요한 셸 재생성
  // (+Firebase read)이 발생하므로, `meta.revalidateShell: true`로 명시한 것만 트리거한다.
  // env(VITE_FRONT_REVALIDATE_URL/SECRET) 미설정 시 no-op, 실패해도 무시(fire-and-forget).
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.revalidateShell) {
        void triggerFrontRevalidation();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
    },
  },
});

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="인증 확인 중..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 인증 초기화 컴포넌트
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={koKR}>
        <AntdApp>
          <BrowserRouter>
            <AuthInitializer>
              <Routes>
                {/* 로그인 페이지 (인증 필요 없음) */}
                <Route path="/login" element={<Login />} />

                {/* 인증이 필요한 페이지들 */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="works" element={<WorksList />} />
                  <Route path="works/new" element={<WorkForm />} />
                  <Route path="works/:id" element={<WorkForm />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </AuthInitializer>
          </BrowserRouter>
        </AntdApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
