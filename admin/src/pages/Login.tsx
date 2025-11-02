// 로그인 페이지 컴포넌트
import { Card, Button, Space, Typography, message } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { mockLogin } from '../stores/authStore';
import './Login.css';

const { Title, Text } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // Google 로그인 핸들러 (하드코딩)
  const handleLogin = async () => {
    try {
      message.loading({ content: '로그인 중...', key: 'login' });
      const user = await mockLogin();
      login(user);
      message.success({ content: '로그인 성공!', key: 'login', duration: 2 });
      navigate('/dashboard');
    } catch (error) {
      message.error({ content: '로그인 실패', key: 'login', duration: 2 });
      console.error('로그인 오류:', error);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Space direction="vertical" size="large" align="center" style={{ width: '100%' }}>
          <div className="login-logo">
            <span style={{ fontSize: '48px' }}>📁</span>
            <Title level={2} style={{ margin: '16px 0 8px' }}>
              Portfolio Admin
            </Title>
            <Text type="secondary">포트폴리오를 관리하세요</Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleLogin}
            block
          >
            Google로 로그인
          </Button>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            (현재는 하드코딩된 로그인을 사용합니다)
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default Login;

