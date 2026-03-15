// 로그인 페이지 컴포넌트
import { Card, Button, Space, Typography, message, Tag } from 'antd';
import { GoogleOutlined, FolderOutlined, ExperimentOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state';
import './Login.css';

const { Title, Text } = Typography;

const isEmulatorMode = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginEmulator, isLoading, error } = useAuthStore();

  // Google 로그인 핸들러 (Firebase)
  const handleLogin = async () => {
    try {
      message.loading({ content: '로그인 중...', key: 'login' });
      await login();
      message.success({ content: '로그인 성공!', key: 'login', duration: 2 });
      navigate('/dashboard');
    } catch (err) {
      message.error({ content: '로그인 실패: ' + (error || '알 수 없는 오류'), key: 'login', duration: 3 });
      console.error('로그인 오류:', err);
    }
  };

  // Emulator 테스트 로그인 핸들러
  const handleEmulatorLogin = async () => {
    try {
      message.loading({ content: 'Emulator 로그인 중...', key: 'login' });
      await loginEmulator();
      message.success({ content: 'Emulator 로그인 성공!', key: 'login', duration: 2 });
      navigate('/dashboard');
    } catch (err) {
      message.error({ content: 'Emulator 로그인 실패: ' + (error || '알 수 없는 오류'), key: 'login', duration: 3 });
      console.error('Emulator 로그인 오류:', err);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <div className="login-logo">
            <FolderOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={2} style={{ margin: '16px 0 8px' }}>
              Portfolio Admin
            </Title>
            <Text type="secondary">포트폴리오를 관리하세요</Text>
            {isEmulatorMode && (
              <Tag color="orange" style={{ marginTop: '8px' }}>Emulator 모드</Tag>
            )}
          </div>
          {isEmulatorMode ? (
            <>
              <Button
                type="primary"
                size="large"
                icon={<ExperimentOutlined />}
                onClick={handleEmulatorLogin}
                loading={isLoading}
                block
              >
                테스트 계정으로 로그인
              </Button>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                admin@test.com (자동 생성)
              </Text>
            </>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<GoogleOutlined />}
              onClick={handleLogin}
              loading={isLoading}
              block
            >
              Google로 로그인
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default Login;

