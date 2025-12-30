// 백업/복원 관리 컴포넌트
import { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Upload,
  Modal,
  Checkbox,
  Typography,
  Descriptions,
  Alert,
  App,
} from 'antd';
import {
  DownloadOutlined,
  UploadOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useCreateBackup, useReadBackupFile, useRestoreBackup } from '../domain/hooks';
import type { BackupData, RestoreOptions } from '../core/types';

const { Text, Title } = Typography;

const BackupManager = () => {
  const { modal, message } = App.useApp();
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [restoreOptions, setRestoreOptions] = useState<RestoreOptions>({
    restoreWorks: true,
    restoreSentenceCategories: true,
    restoreExhibitionCategories: true,
    restoreSettings: true,
    conflictStrategy: 'overwrite',
  });
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [restoreConfirmed, setRestoreConfirmed] = useState(false);

  const createBackupMutation = useCreateBackup();
  const readBackupFileMutation = useReadBackupFile();
  const restoreBackupMutation = useRestoreBackup();

  // 백업 생성
  const handleCreateBackup = async () => {
    try {
      await createBackupMutation.mutateAsync();
      message.success('백업 파일이 다운로드되었습니다.');
    } catch (error) {
      console.error('백업 생성 실패:', error);
      modal.error({
        title: '백업 실패',
        content: '백업 파일을 생성하는 중 오류가 발생했습니다.',
      });
    }
  };

  // 백업 파일 선택
  const handleFileSelect = async (file: File) => {
    try {
      const data = await readBackupFileMutation.mutateAsync(file);
      setBackupData(data);
      setRestoreConfirmed(false); // 확인 상태 초기화
      setPreviewModalVisible(true);
      return false; // Upload 컴포넌트의 자동 업로드 방지
    } catch (error) {
      console.error('파일 읽기 실패:', error);
      modal.error({
        title: '파일 읽기 실패',
        content: error instanceof Error ? error.message : '백업 파일을 읽을 수 없습니다.',
      });
      return false;
    }
  };

  // 복원 실행
  const handleRestore = () => {
    if (!backupData || !restoreConfirmed) {
      if (!restoreConfirmed) {
        message.warning('복원을 진행하려면 하단의 확인 체크박스를 선택해주세요.');
      }
      return;
    }

    // 복원할 항목 목록 생성
    const restoreItems: string[] = [];
    if (restoreOptions.restoreWorks) {
      restoreItems.push(`작업 ${backupData.metadata.workCount}개`);
    }
    if (restoreOptions.restoreSentenceCategories) {
      restoreItems.push(`문장 카테고리 ${backupData.metadata.sentenceCategoryCount}개`);
    }
    if (restoreOptions.restoreExhibitionCategories) {
      restoreItems.push(`전시 카테고리 ${backupData.metadata.exhibitionCategoryCount}개`);
    }
    if (restoreOptions.restoreSettings) {
      restoreItems.push('사이트 설정');
    }

    modal.confirm({
      title: '⚠️ 데이터 복원 최종 확인',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <Alert
            message="경고"
            description="현재 데이터가 백업 파일로 완전히 덮어씌워집니다. 이 작업은 되돌릴 수 없습니다."
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <div style={{ marginBottom: 12 }}>
            <Text strong>복원할 데이터:</Text>
            <ul style={{ marginTop: 8, marginBottom: 0 }}>
              {restoreItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 12 }}>
            <Text strong>백업 일시:</Text>{' '}
            <Text>{new Date(backupData.timestamp).toLocaleString('ko-KR')}</Text>
          </div>

          <Alert
            message="주의사항"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li>백업 이후 추가/수정된 데이터는 모두 삭제됩니다.</li>
                <li>복원 후 페이지가 자동으로 새로고침됩니다.</li>
                <li>진행 전 현재 데이터를 백업하는 것을 강력히 권장합니다.</li>
              </ul>
            }
            type="warning"
            showIcon
          />
        </div>
      ),
      okText: '복원 진행',
      cancelText: '취소',
      okType: 'danger',
      width: 600,
      onOk: async () => {
        try {
          await restoreBackupMutation.mutateAsync({
            backup: backupData,
            options: restoreOptions,
          });

          message.success('데이터가 성공적으로 복원되었습니다.');
          setPreviewModalVisible(false);
          setBackupData(null);
          setRestoreConfirmed(false);

          // 페이지 새로고침
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error('복원 실패:', error);
          modal.error({
            title: '복원 실패',
            content: '데이터 복원 중 오류가 발생했습니다.',
          });
        }
      },
    });
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card title={<><DatabaseOutlined /> 백업 및 복원</>}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 백업 생성 */}
        <div>
          <Title level={5}>백업 생성</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            현재 모든 데이터를 JSON 파일로 다운로드합니다.
          </Text>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleCreateBackup}
            loading={createBackupMutation.isPending}
          >
            백업 파일 다운로드
          </Button>
        </div>

        {/* 백업 복원 */}
        <div>
          <Title level={5}>백업 복원</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            이전에 생성한 백업 파일을 업로드하여 데이터를 복원합니다.
          </Text>
          <Upload
            accept=".json"
            beforeUpload={handleFileSelect}
            showUploadList={false}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />} loading={readBackupFileMutation.isPending}>
              백업 파일 선택
            </Button>
          </Upload>
        </div>

        {/* 안내 */}
        <Alert
          message="백업 파일 정보"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
              <li>백업 파일에는 작업, 카테고리, 사이트 설정이 포함됩니다.</li>
              <li>이미지 파일은 포함되지 않으며, 이미지 URL만 저장됩니다.</li>
              <li>복원 시 기존 데이터가 덮어씌워질 수 있으니 주의하세요.</li>
            </ul>
          }
          type="info"
          icon={<InfoCircleOutlined />}
        />
      </Space>

      {/* 복원 미리보기 모달 */}
      <Modal
        title="백업 데이터 미리보기"
        open={previewModalVisible}
        onCancel={() => {
          setPreviewModalVisible(false);
          setBackupData(null);
          setRestoreConfirmed(false);
        }}
        onOk={handleRestore}
        okText="복원"
        cancelText="취소"
        width={700}
        okButtonProps={{
          loading: restoreBackupMutation.isPending,
          disabled: !restoreConfirmed,
          danger: true,
        }}
      >
        {backupData && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 백업 정보 */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="백업 버전" span={2}>
                {backupData.version}
              </Descriptions.Item>
              <Descriptions.Item label="백업 일시" span={2}>
                {new Date(backupData.timestamp).toLocaleString('ko-KR')}
              </Descriptions.Item>
              <Descriptions.Item label="작업 수">
                {backupData.metadata.workCount}개
              </Descriptions.Item>
              <Descriptions.Item label="문장 카테고리">
                {backupData.metadata.sentenceCategoryCount}개
              </Descriptions.Item>
              <Descriptions.Item label="전시 카테고리">
                {backupData.metadata.exhibitionCategoryCount}개
              </Descriptions.Item>
              <Descriptions.Item label="파일 크기">
                {formatFileSize(backupData.metadata.totalSize)}
              </Descriptions.Item>
            </Descriptions>

            {/* 복원 옵션 */}
            <div>
              <Title level={5}>복원할 데이터 선택</Title>
              <Space direction="vertical">
                <Checkbox
                  checked={restoreOptions.restoreWorks}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, restoreWorks: e.target.checked })
                  }
                >
                  작업 ({backupData.metadata.workCount}개)
                </Checkbox>
                <Checkbox
                  checked={restoreOptions.restoreSentenceCategories}
                  onChange={(e) =>
                    setRestoreOptions({
                      ...restoreOptions,
                      restoreSentenceCategories: e.target.checked,
                    })
                  }
                >
                  문장 카테고리 ({backupData.metadata.sentenceCategoryCount}개)
                </Checkbox>
                <Checkbox
                  checked={restoreOptions.restoreExhibitionCategories}
                  onChange={(e) =>
                    setRestoreOptions({
                      ...restoreOptions,
                      restoreExhibitionCategories: e.target.checked,
                    })
                  }
                >
                  전시 카테고리 ({backupData.metadata.exhibitionCategoryCount}개)
                </Checkbox>
                <Checkbox
                  checked={restoreOptions.restoreSettings}
                  onChange={(e) =>
                    setRestoreOptions({ ...restoreOptions, restoreSettings: e.target.checked })
                  }
                >
                  사이트 설정
                </Checkbox>
              </Space>
            </div>

            {/* 복원 방식 안내 */}
            <Alert
              message="복원 정보"
              description={
                <div>
                  <p style={{ marginBottom: 8 }}>
                    <strong>복원 방식:</strong> 백업 파일의 데이터로 현재 데이터를 덮어씁니다.
                  </p>
                  <p style={{ marginBottom: 8 }}>
                    <strong>권장사항:</strong> 복원 전 현재 데이터를 백업하세요.
                  </p>
                  <p style={{ marginBottom: 0 }}>
                    <strong>주의:</strong> 백업 이후 추가/수정된 데이터는 삭제됩니다.
                  </p>
                </div>
              }
              type="warning"
              showIcon
            />

            {/* 복원 확인 체크박스 */}
            <div
              style={{
                padding: 16,
                background: '#fff7e6',
                borderRadius: 4,
                border: '1px solid #ffd666',
              }}
            >
              <Checkbox
                checked={restoreConfirmed}
                onChange={(e) => setRestoreConfirmed(e.target.checked)}
              >
                <Text strong style={{ color: '#d46b08' }}>
                  위 내용을 확인했으며, 데이터 복원을 진행하겠습니다.
                </Text>
              </Checkbox>
            </div>
          </Space>
        )}
      </Modal>
    </Card>
  );
};

export default BackupManager;
