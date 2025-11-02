// 설정 페이지 컴포넌트
import { useState } from 'react';
import {
  Typography,
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Space,
  message,
  Divider,
  Popconfirm,
} from 'antd';
import {
  UserOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import './Settings.css';

const { Title } = Typography;
const { TextArea } = Input;

const Settings = () => {
  const [profileForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const { user } = useAuthStore();

  // 프로필 수정
  const handleProfileSave = async () => {
    try {
      const values = await profileForm.validateFields();
      message.success('프로필이 수정되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 사이트 설정 저장
  const handleSiteSave = async () => {
    try {
      const values = await siteForm.validateFields();
      message.success('사이트 설정이 저장되었습니다.');
    } catch (error) {
      console.error('저장 실패:', error);
    }
  };

  // 데이터 내보내기
  const handleExportData = () => {
    message.info('데이터 내보내기 기능은 향후 구현 예정입니다.');
    // 실제 구현 시 JSON 파일로 다운로드
  };

  // 데이터 가져오기
  const handleImportData = () => {
    message.info('데이터 가져오기 기능은 향후 구현 예정입니다.');
    // 실제 구현 시 파일 업로드 및 파싱
  };

  // 모든 데이터 삭제
  const handleDeleteAllData = () => {
    message.warning('모든 데이터 삭제 기능은 향후 구현 예정입니다.');
    // 실제 구현 시 확인 후 삭제
  };

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
      <Card title="사이트 설정" style={{ marginBottom: '24px' }}>
        <Form
          form={siteForm}
          layout="vertical"
          initialValues={{
            siteTitle: '민지의 포트폴리오',
            siteDescription: '조각 작품을 전시합니다',
          }}
        >
          <Form.Item name="siteTitle" label="사이트 제목">
            <Input placeholder="사이트 제목을 입력하세요" />
          </Form.Item>
          <Form.Item name="siteDescription" label="사이트 설명">
            <TextArea rows={3} placeholder="사이트 설명을 입력하세요" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSiteSave}>
              저장
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* 데이터 관리 섹션 */}
      <Card title="데이터 관리">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Button
            block
            icon={<DownloadOutlined />}
            onClick={handleExportData}
            style={{ textAlign: 'left' }}
          >
            데이터 내보내기 (JSON)
          </Button>
          <Button
            block
            icon={<UploadOutlined />}
            onClick={handleImportData}
            style={{ textAlign: 'left' }}
          >
            데이터 가져오기
          </Button>
          <Divider />
          <Popconfirm
            title="정말 모든 데이터를 삭제하시겠습니까?"
            description="이 작업은 되돌릴 수 없습니다."
            onConfirm={handleDeleteAllData}
            okText="삭제"
            cancelText="취소"
            okType="danger"
          >
            <Button
              block
              danger
              icon={<DeleteOutlined />}
              style={{ textAlign: 'left' }}
            >
              모든 데이터 삭제 (위험)
            </Button>
          </Popconfirm>
        </Space>
      </Card>
    </div>
  );
};

export default Settings;
