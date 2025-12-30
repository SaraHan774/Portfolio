// 설정 페이지 컴포넌트
import { useState, useEffect } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  message,
  notification,
  Spin,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../state';
import {
  getSiteSettings,
  updateSiteSettings,
} from '../data/repository';
import BackupManager from '../components/BackupManager';
import './Settings.css';

const { Title } = Typography;

const Settings = () => {
  const [profileForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 사이트 설정 로드
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        setLoading(true);
        const settings = await getSiteSettings();
        siteForm.setFieldsValue({
          footerText: settings.footerText,
        });
      } catch (error) {
        console.error('설정 로드 실패:', error);
        message.error('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadSiteSettings();
  }, [siteForm]);

  // 프로필 수정
  const handleProfileSave = async () => {
    try {
      await profileForm.validateFields();
      message.success('프로필이 수정되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 사이트 설정 저장
  const handleSiteSave = async () => {
    try {
      const values = await siteForm.validateFields();
      setSaving(true);

      await updateSiteSettings({
        footerText: values.footerText,
      });

      notification.success({
        message: '저장 완료',
        description: '푸터 텍스트가 성공적으로 저장되었습니다.',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('저장 실패:', error);
      message.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="settings" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="settings">
      <Title level={2}><SettingOutlined /> 설정</Title>

      {/* 프로필 섹션 */}
      <Card title="프로필" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Avatar
              size={100}
              icon={<UserOutlined />}
              src={user?.profileImage}
              style={{ marginBottom: '16px' }}
            />
          </div>
          <Form
            form={profileForm}
            layout="vertical"
            initialValues={{
              name: user?.displayName || '',
              email: user?.email || '',
            }}
          >
            <Form.Item name="name" label="이름">
              <Input placeholder="이름을 입력하세요" />
            </Form.Item>
            <Form.Item name="email" label="이메일">
              <Input disabled placeholder="이메일" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} onClick={handleProfileSave}>
                프로필 수정
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>

      {/* 사이트 설정 섹션 */}
      <Card
        title={<><GlobalOutlined /> 사이트 설정</>}
        style={{ marginBottom: '24px' }}
      >
        <Form
          form={siteForm}
          layout="vertical"
          initialValues={{
            footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
          }}
        >
          <Form.Item
            name="footerText"
            label="푸터 텍스트"
            rules={[{ required: true, message: '푸터 텍스트를 입력하세요' }]}
            extra="웹사이트 하단에 표시되는 텍스트입니다. (예: 이름, 이메일, 전화번호)"
          >
            <Input placeholder="나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSiteSave}
              loading={saving}
            >
              저장
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 데이터 관리 섹션 */}
      <BackupManager />
    </div>
  );
};

export default Settings;
