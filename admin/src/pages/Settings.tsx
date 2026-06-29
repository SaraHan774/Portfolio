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
  Alert,
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../state';
import type { SiteSettings } from '../core/types';
import {
  getSiteSettings,
  updateSiteSettings,
  uploadHomeIcon,
  uploadHomeIconHover,
  deleteHomeIcon,
  deleteHomeIconHover,
  updateHomeIconSize,
  settingsCacheKeys,
} from '../data/repository';
import BackupManager from '../components/BackupManager';
import HomeIconManager from '../components/HomeIconManager';
import './Settings.css';

const { Title } = Typography;

const Settings = () => {
  const [profileForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSettings, setSiteSettings] = useState<Pick<SiteSettings, 'footerText' | 'homeIconUrl' | 'homeIconHoverUrl' | 'homeIconSize'>>({
    footerText: '',
    homeIconSize: 48,
  });

  // 사이트 설정 로드
  useEffect(() => {
    const loadSiteSettings = async () => {
      try {
        setLoading(true);
        const settings = await getSiteSettings();
        siteForm.setFieldsValue({
          footerText: settings.footerText,
          browserDescription: settings.browserDescription,
        });
        setSiteSettings({
          footerText: settings.footerText,
          homeIconUrl: settings.homeIconUrl,
          homeIconHoverUrl: settings.homeIconHoverUrl,
          homeIconSize: settings.homeIconSize ?? 48,
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
        browserDescription: values.browserDescription,
      });

      notification.success({
        message: '저장 완료',
        description: '사이트 설정이 성공적으로 저장되었습니다.',
        placement: 'topRight',
      });
    } catch (error) {
      console.error('저장 실패:', error);
      message.error('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 홈 아이콘 업로드 핸들러
  const handleUploadHomeIcon = async (file: File) => {
    const url = await uploadHomeIcon(file);
    setSiteSettings((prev) => ({ ...prev, homeIconUrl: url }));
    // 캐시된 설정에 새 홈 아이콘 URL 반영
    queryClient.setQueryData<SiteSettings | undefined>(
      settingsCacheKeys.site(),
      (old) => (old ? { ...old, homeIconUrl: url } : old)
    );
  };

  const handleUploadHomeIconHover = async (file: File) => {
    const url = await uploadHomeIconHover(file);
    setSiteSettings((prev) => ({ ...prev, homeIconHoverUrl: url }));
    // 캐시된 설정에 새 호버 홈 아이콘 URL 반영
    queryClient.setQueryData<SiteSettings | undefined>(
      settingsCacheKeys.site(),
      (old) => (old ? { ...old, homeIconHoverUrl: url } : old)
    );
  };

  const handleDeleteHomeIcon = async () => {
    await deleteHomeIcon();
    setSiteSettings((prev) => ({ ...prev, homeIconUrl: undefined }));
    // 캐시된 설정에서 홈 아이콘 URL 제거
    queryClient.setQueryData<SiteSettings | undefined>(
      settingsCacheKeys.site(),
      (old) => (old ? { ...old, homeIconUrl: undefined } : old)
    );
  };

  const handleDeleteHomeIconHover = async () => {
    await deleteHomeIconHover();
    setSiteSettings((prev) => ({ ...prev, homeIconHoverUrl: undefined }));
    // 캐시된 설정에서 호버 홈 아이콘 URL 제거
    queryClient.setQueryData<SiteSettings | undefined>(
      settingsCacheKeys.site(),
      (old) => (old ? { ...old, homeIconHoverUrl: undefined } : old)
    );
  };

  const handleUpdateIconSize = async (size: number) => {
    await updateHomeIconSize(size);
    setSiteSettings((prev) => ({ ...prev, homeIconSize: size }));
    // 캐시된 설정에 새 아이콘 크기 반영
    queryClient.setQueryData<SiteSettings | undefined>(
      settingsCacheKeys.site(),
      (old) => (old ? { ...old, homeIconSize: size } : old)
    );
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
            browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
          }}
        >
          <Form.Item
            name="browserDescription"
            label="사이트 소개 글 (검색 노출)"
            rules={[{ required: true, message: '사이트 소개 글을 입력하세요' }]}
            extra="구글 등 검색 결과에 노출되는 사이트 소개 글입니다. (메타 설명, 권장 70~160자)"
          >
            <Input.TextArea
              rows={3}
              maxLength={200}
              showCount
              placeholder="여백의 미를 살린 미니멀한 디지털 갤러리"
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
            message="구글 검색 결과에는 바로 반영되지 않습니다"
            description={
              <div style={{ lineHeight: 1.7 }}>
                저장하면 <b>사이트 자체</b>에는 즉시 새 소개 글이 적용됩니다. 다만{' '}
                <b>구글 검색 결과 화면</b>에 보이는 글은, 구글이 사이트를 다시 방문해
                재색인한 뒤에야 바뀌며 보통 <b>며칠~몇 주</b>가 걸립니다. (검색엔진 구조상
                즉시 반영은 불가능합니다.)
                <br />
                <br />
                · 더 빨리 반영하려면 <b>Google Search Console</b>의 "URL 검사 → 색인 생성
                요청"을 이용하세요.
                <br />
                · 구글은 이 소개 글을 항상 그대로 쓰지 않고, 검색어에 따라 본문에서 더
                적절한 문장을 골라 스니펫을 자동 생성하기도 합니다. (소개 글은 강한
                힌트이지 강제값이 아닙니다.)
              </div>
            }
          />

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

      {/* 홈 아이콘 설정 섹션 */}
      <HomeIconManager
        homeIconUrl={siteSettings.homeIconUrl}
        homeIconHoverUrl={siteSettings.homeIconHoverUrl}
        homeIconSize={siteSettings.homeIconSize}
        onUploadHomeIcon={handleUploadHomeIcon}
        onUploadHomeIconHover={handleUploadHomeIconHover}
        onDeleteHomeIcon={handleDeleteHomeIcon}
        onDeleteHomeIconHover={handleDeleteHomeIconHover}
        onUpdateIconSize={handleUpdateIconSize}
      />

      {/* 데이터 관리 섹션 */}
      <BackupManager />
    </div>
  );
};

export default Settings;
