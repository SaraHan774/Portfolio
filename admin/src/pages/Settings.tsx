// 설정 페이지 컴포넌트
import { useState, useEffect, useRef } from 'react';
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
  Divider,
  Popconfirm,
  Spin,
} from 'antd';
import {
  UserOutlined,
  DownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  SaveOutlined,
  SettingOutlined,
  GlobalOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import {
  getSiteSettings,
  updateSiteSettings,
  uploadFavicon,
  deleteFavicon,
} from '../services/settingsService';
import './Settings.css';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Settings = () => {
  const [profileForm] = Form.useForm();
  const [siteForm] = Form.useForm();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // 사이트 설정 로드
  useEffect(() => {
    loadSiteSettings();
  }, []);

  const loadSiteSettings = async () => {
    try {
      setLoading(true);
      const settings = await getSiteSettings();
      setFaviconPreview(settings.faviconUrl || null);
      siteForm.setFieldsValue({
        browserTitle: settings.browserTitle,
        browserDescription: settings.browserDescription,
        footerText: settings.footerText,
      });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      message.error('설정을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
        browserTitle: values.browserTitle,
        browserDescription: values.browserDescription,
        footerText: values.footerText,
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

  // 파비콘 업로드 처리
  const handleFaviconUpload = async (file: File) => {
    try {
      setSaving(true);
      const faviconUrl = await uploadFavicon(file);
      setFaviconPreview(faviconUrl);
      message.success('파비콘이 업로드되었습니다.');
    } catch (error) {
      console.error('파비콘 업로드 실패:', error);
      message.error('파비콘 업로드에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 파비콘 삭제
  const handleFaviconDelete = async () => {
    try {
      setSaving(true);
      await deleteFavicon();
      setFaviconPreview(null);
      message.success('파비콘이 삭제되었습니다.');
    } catch (error) {
      console.error('파비콘 삭제 실패:', error);
      message.error('파비콘 삭제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 파비콘 파일 선택 핸들러
  const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // .ico 또는 이미지 파일만 허용
      const isValidType = file.type === 'image/x-icon' ||
                          file.type === 'image/vnd.microsoft.icon' ||
                          file.type === 'image/png' ||
                          file.type === 'image/jpeg' ||
                          file.name.endsWith('.ico');

      if (!isValidType) {
        message.error('ICO, PNG, JPEG 파일만 업로드 가능합니다.');
        return;
      }

      if (file.size > 1024 * 1024) { // 1MB 제한
        message.error('파일 크기는 1MB 이하여야 합니다.');
        return;
      }

      handleFaviconUpload(file);
    }
    // 같은 파일 다시 선택 가능하도록 초기화
    if (faviconInputRef.current) {
      faviconInputRef.current.value = '';
    }
  };

  // 데이터 내보내기
  const handleExportData = () => {
    message.info('데이터 내보내기 기능은 향후 구현 예정입니다.');
  };

  // 데이터 가져오기
  const handleImportData = () => {
    message.info('데이터 가져오기 기능은 향후 구현 예정입니다.');
  };

  // 모든 데이터 삭제
  const handleDeleteAllData = () => {
    message.warning('모든 데이터 삭제 기능은 향후 구현 예정입니다.');
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
            browserTitle: 'Portfolio | 작품 갤러리',
            browserDescription: '여백의 미를 살린 미니멀한 디지털 갤러리',
            footerText: '나혜빈, hyebinnaa@gmail.com, 82)10-8745-1728',
          }}
        >
          <Form.Item
            name="browserTitle"
            label="브라우저 탭 제목"
            rules={[{ required: true, message: '브라우저 탭 제목을 입력하세요' }]}
            extra="브라우저 탭에 표시되는 사이트 제목입니다."
          >
            <Input placeholder="Portfolio | 작품 갤러리" />
          </Form.Item>

          <Form.Item
            name="browserDescription"
            label="사이트 설명 (SEO)"
            rules={[{ required: true, message: '사이트 설명을 입력하세요' }]}
            extra="검색엔진에 표시되는 사이트 설명입니다."
          >
            <TextArea rows={2} placeholder="여백의 미를 살린 미니멀한 디지털 갤러리" />
          </Form.Item>

          <Divider />

          <Form.Item
            label="파비콘"
            extra="브라우저 탭에 표시되는 작은 아이콘입니다. ICO, PNG, JPEG 파일 (1MB 이하)"
          >
            <Space direction="vertical" size="middle">
              {faviconPreview ? (
                <Space>
                  <img
                    src={faviconPreview}
                    alt="파비콘 미리보기"
                    style={{
                      width: '32px',
                      height: '32px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '4px',
                      objectFit: 'contain',
                    }}
                  />
                  <Text type="secondary">현재 파비콘</Text>
                  <Popconfirm
                    title="파비콘을 삭제하시겠습니까?"
                    onConfirm={handleFaviconDelete}
                    okText="삭제"
                    cancelText="취소"
                  >
                    <Button
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      loading={saving}
                    >
                      삭제
                    </Button>
                  </Popconfirm>
                </Space>
              ) : (
                <Text type="secondary">파비콘이 설정되지 않았습니다.</Text>
              )}
              <input
                ref={faviconInputRef}
                type="file"
                accept=".ico,.png,.jpeg,.jpg,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg"
                onChange={handleFaviconFileChange}
                style={{ display: 'none' }}
              />
              <Button
                icon={<FileImageOutlined />}
                onClick={() => faviconInputRef.current?.click()}
                loading={saving}
              >
                {faviconPreview ? '파비콘 변경' : '파비콘 업로드'}
              </Button>
            </Space>
          </Form.Item>

          <Divider />

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