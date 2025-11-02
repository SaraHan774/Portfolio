import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorksList from './pages/WorksList';
import WorkForm from './pages/WorkForm';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import { useAuthStore } from './stores/authStore';
import './App.css';

// React Query 클라이언트 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      refetchOnWindowFocus: false,
    },
  },
});

// 인증이 필요한 라우트를 보호하는 컴포넌트
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={koKR}>
        <BrowserRouter>
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
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
