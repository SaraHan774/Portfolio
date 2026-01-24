// 홈 아이콘 설정 컴포넌트
import { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Upload,
  Image,
  Typography,
  Alert,
  App,
  Row,
  Col,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  HomeOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { getErrorDisplayInfo } from '../core/utils/errorMessages';

const { Text, Title } = Typography;

interface HomeIconManagerProps {
  homeIconUrl?: string;
  homeIconHoverUrl?: string;
  onUploadHomeIcon: (file: File) => Promise<void>;
  onUploadHomeIconHover: (file: File) => Promise<void>;
  onDeleteHomeIcon: () => Promise<void>;
  onDeleteHomeIconHover: () => Promise<void>;
}

const HomeIconManager = ({
  homeIconUrl,
  homeIconHoverUrl,
  onUploadHomeIcon,
  onUploadHomeIconHover,
  onDeleteHomeIcon,
  onDeleteHomeIconHover,
}: HomeIconManagerProps) => {
  const { modal, message } = App.useApp();
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingHover, setUploadingHover] = useState(false);

  // 이미지 크기 검증
  const validateImageSize = async (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(objectUrl); // Clean up
        const width = img.width;
        const height = img.height;

        if (width > 300 || height > 300) {
          modal.error({
            title: '이미지 크기 초과',
            content: `이미지 크기는 300x300 픽셀 이하여야 합니다.\n현재 이미지: ${width}x${height}`,
          });
          resolve(false);
        } else {
          resolve(true);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl); // Clean up
        modal.error({
          title: '이미지 로드 실패',
          content: '이미지 파일을 읽을 수 없습니다.',
        });
        resolve(false);
      };
      img.src = objectUrl;
    });
  };

  // 기본 홈 아이콘 업로드
  const handleUploadHomeIcon = async (file: File) => {
    try {
      // 이미지 크기 검증
      const isValid = await validateImageSize(file);
      if (!isValid) {
        return false;
      }

      setUploadingIcon(true);
      await onUploadHomeIcon(file);
      message.success('홈 아이콘이 업로드되었습니다.');
      return false; // Upload 컴포넌트의 자동 업로드 방지
    } catch (error) {
      console.error('홈 아이콘 업로드 실패:', error);
      const errorInfo = getErrorDisplayInfo(error);
      modal.error({
        title: errorInfo.title,
        content: (
          <div>
            <p>{errorInfo.message}</p>
            {errorInfo.action && <p style={{ marginTop: 8, color: '#666' }}>{errorInfo.action}</p>}
          </div>
        ),
      });
      return false;
    } finally {
      setUploadingIcon(false);
    }
  };

  // 호버 홈 아이콘 업로드
  const handleUploadHomeIconHover = async (file: File) => {
    try {
      // 이미지 크기 검증
      const isValid = await validateImageSize(file);
      if (!isValid) {
        return false;
      }

      setUploadingHover(true);
      await onUploadHomeIconHover(file);
      message.success('호버 홈 아이콘이 업로드되었습니다.');
      return false;
    } catch (error) {
      console.error('호버 홈 아이콘 업로드 실패:', error);
      const errorInfo = getErrorDisplayInfo(error);
      modal.error({
        title: errorInfo.title,
        content: (
          <div>
            <p>{errorInfo.message}</p>
            {errorInfo.action && <p style={{ marginTop: 8, color: '#666' }}>{errorInfo.action}</p>}
          </div>
        ),
      });
      return false;
    } finally {
      setUploadingHover(false);
    }
  };

  // 기본 홈 아이콘 삭제
  const handleDeleteHomeIcon = async () => {
    try {
      await onDeleteHomeIcon();
      message.success('홈 아이콘이 삭제되었습니다.');
    } catch (error) {
      console.error('홈 아이콘 삭제 실패:', error);
      const errorInfo = getErrorDisplayInfo(error);
      modal.error({
        title: errorInfo.title,
        content: (
          <div>
            <p>{errorInfo.message}</p>
            {errorInfo.action && <p style={{ marginTop: 8, color: '#666' }}>{errorInfo.action}</p>}
          </div>
        ),
      });
    }
  };

  // 호버 홈 아이콘 삭제
  const handleDeleteHomeIconHover = async () => {
    try {
      await onDeleteHomeIconHover();
      message.success('호버 홈 아이콘이 삭제되었습니다.');
    } catch (error) {
      console.error('호버 홈 아이콘 삭제 실패:', error);
      const errorInfo = getErrorDisplayInfo(error);
      modal.error({
        title: errorInfo.title,
        content: (
          <div>
            <p>{errorInfo.message}</p>
            {errorInfo.action && <p style={{ marginTop: 8, color: '#666' }}>{errorInfo.action}</p>}
          </div>
        ),
      });
    }
  };

  return (
    <Card title={<><HomeOutlined /> 홈 아이콘 설정</>}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 안내 */}
        <Alert
          message="홈 아이콘 정보"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>프론트 페이지의 홈 아이콘으로 사용될 이미지를 설정합니다.</li>
              <li>이미지 크기는 300x300 픽셀 이하여야 합니다.</li>
              <li>기본 아이콘과 호버 상태 아이콘을 각각 설정할 수 있습니다.</li>
              <li>지원 형식: JPG, JPEG, PNG, WebP, GIF</li>
            </ul>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: 24 }}
        />

        <Row gutter={24}>
          {/* 기본 홈 아이콘 */}
          <Col xs={24} md={12}>
            <div>
              <Title level={5}>기본 홈 아이콘</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                기본 상태의 홈 아이콘입니다.
              </Text>

              {homeIconUrl && (
                <div style={{ marginBottom: 12 }}>
                  <Image
                    src={homeIconUrl}
                    alt="홈 아이콘"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}

              <Space>
                <Upload
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  beforeUpload={handleUploadHomeIcon}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingIcon}
                  >
                    {homeIconUrl ? '변경' : '업로드'}
                  </Button>
                </Upload>

                {homeIconUrl && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteHomeIcon}
                    disabled={uploadingIcon}
                  >
                    삭제
                  </Button>
                )}
              </Space>
            </div>
          </Col>

          {/* 호버 홈 아이콘 */}
          <Col xs={24} md={12}>
            <div>
              <Title level={5}>호버 홈 아이콘</Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                마우스 호버 시 표시될 홈 아이콘입니다.
              </Text>

              {homeIconHoverUrl && (
                <div style={{ marginBottom: 12 }}>
                  <Image
                    src={homeIconHoverUrl}
                    alt="호버 홈 아이콘"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      objectFit: 'contain',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                    }}
                  />
                </div>
              )}

              <Space>
                <Upload
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  beforeUpload={handleUploadHomeIconHover}
                  showUploadList={false}
                  maxCount={1}
                >
                  <Button
                    icon={<UploadOutlined />}
                    loading={uploadingHover}
                  >
                    {homeIconHoverUrl ? '변경' : '업로드'}
                  </Button>
                </Upload>

                {homeIconHoverUrl && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDeleteHomeIconHover}
                    disabled={uploadingHover}
                  >
                    삭제
                  </Button>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </Space>
    </Card>
  );
};

export default HomeIconManager;
