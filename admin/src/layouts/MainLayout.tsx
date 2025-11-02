// 메인 레이아웃 컴포넌트 (Header + Sidebar + Content)
import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Drawer, Button, FloatButton } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  FolderOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import './MainLayout.css';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 메뉴 항목 정의
  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '대시보드',
    },
    {
      key: '/works',
      icon: <AppstoreOutlined />,
      label: '작업 관리',
    },
    {
      key: '/categories',
      icon: <FolderOutlined />,
      label: '카테고리',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '설정',
    },
  ];

  // 메뉴 클릭 핸들러
  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
    // 모바일에서는 메뉴 클릭 후 Drawer 닫기
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // 사용자 메뉴 항목
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '프로필',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      danger: true,
    },
  ];

  // 사용자 메뉴 클릭 핸들러
  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  // 메뉴 컴포넌트 (재사용)
  const MenuComponent = () => (
    <Menu
      mode="inline"
      theme="dark"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ height: '100%', borderRight: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ color: 'white', fontSize: '18px' }}
            />
          )}
          <div className="logo">📁 Portfolio Admin</div>
        </div>
        <div className="user-menu">
          {isMobile ? (
            <Avatar icon={<UserOutlined />} src={user?.profileImage} />
          ) : (
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
            >
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Avatar icon={<UserOutlined />} src={user?.profileImage} />
                <span style={{ color: 'white' }}>{user?.displayName || '사용자'}</span>
              </div>
            </Dropdown>
          )}
        </div>
      </Header>
      <Layout>
        {/* 데스크탑 사이드바 */}
        {!isMobile && (
          <Sider width={200} theme="dark" className="desktop-sider">
            <MenuComponent />
          </Sider>
        )}

        {/* 모바일 Drawer */}
        {isMobile && (
          <Drawer
            title="메뉴"
            placement="left"
            onClose={() => setMobileMenuOpen(false)}
            open={mobileMenuOpen}
            bodyStyle={{ padding: 0 }}
            width={200}
          >
            <MenuComponent />
          </Drawer>
        )}

        <Layout style={{ padding: isMobile ? '16px' : '24px' }}>
          <Content className="main-content">
            <Outlet />
          </Content>
        </Layout>
      </Layout>

      {/* 모바일 FAB - 빠른 작업 추가 (작업 목록 페이지에서만 표시) */}
      {isMobile && location.pathname === '/works' && (
        <FloatButton
          icon={<PlusOutlined />}
          type="primary"
          style={{ right: 24, bottom: 24 }}
          onClick={() => navigate('/works/new')}
          tooltip="새 작업 추가"
        />
      )}
    </Layout>
  );
};

export default MainLayout;

