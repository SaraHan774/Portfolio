// 기존 업로드 이미지 LQIP 블러 백필 관리 컴포넌트
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Progress,
  Descriptions,
  App,
} from 'antd';
import { PictureOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useEffect, useRef } from 'react';
import { useBlurBackfill } from '../domain/hooks';

const { Text, Title, Paragraph } = Typography;

/**
 * 신규 업로드부터는 블러 플레이스홀더가 자동 생성되지만, 기존에 올라간 이미지에는
 * `blurDataURL`이 없다. 이 컴포넌트로 기존 이미지에 블러를 일괄 생성(백필)한다.
 *
 * 주의: 브라우저 Canvas로 원격 이미지를 읽으므로 Storage 버킷에 CORS 설정이 필요하다
 * (미설정 시 해당 이미지는 실패로 집계되고 전체는 계속 진행).
 */
const BlurBackfillManager = () => {
  const { message } = App.useApp();
  const { isRunning, isDone, progress, error, run } = useBlurBackfill();
  const notifiedRef = useRef(false);

  // 완료/오류 시 1회 알림
  useEffect(() => {
    if (isRunning) {
      notifiedRef.current = false;
      return;
    }
    if (notifiedRef.current) return;

    if (error) {
      notifiedRef.current = true;
      message.error(`백필 실패: ${error}`);
    } else if (isDone) {
      notifiedRef.current = true;
      if (progress.imagesUpdated === 0 && progress.imagesFailed === 0) {
        message.info('블러를 생성할 기존 이미지가 없습니다. 모두 최신 상태입니다.');
      } else if (progress.imagesFailed > 0) {
        message.warning(
          `백필 완료: ${progress.imagesUpdated}장 생성, ${progress.imagesFailed}장 실패(CORS 설정 확인 필요)`
        );
      } else {
        message.success(`백필 완료: 이미지 ${progress.imagesUpdated}장에 블러 생성`);
      }
    }
  }, [isRunning, isDone, error, progress.imagesUpdated, progress.imagesFailed, message]);

  const percent =
    progress.totalWorks === 0
      ? 0
      : Math.round((progress.processedWorks / progress.totalWorks) * 100);

  const showResult = isDone || isRunning;

  return (
    <Card style={{ marginBottom: '24px' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Title level={4} style={{ margin: 0 }}>
          <PictureOutlined style={{ marginRight: 8 }} />
          기존 이미지 블러 백필
        </Title>

        <Paragraph type="secondary" style={{ margin: 0 }}>
          신규 업로드 이미지는 로딩 플레이스홀더(블러)가 자동 생성됩니다. 이 작업은
          <Text strong> 이전에 올라간 이미지</Text>에도 블러를 일괄 생성합니다. 이미 블러가 있는
          이미지는 건너뛰며, 중간에 멈춰도 다시 실행하면 남은 것만 처리됩니다(멱등).
        </Paragraph>

        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="실행 전 확인"
          description={
            <Text type="secondary">
              브라우저에서 기존 이미지를 읽어 블러를 만들기 때문에 Storage 버킷에 CORS 설정이 필요합니다.
              설정이 없으면 해당 이미지는 “실패”로 집계되고 나머지는 계속 진행됩니다. 설정 방법은 저장소의{' '}
              <Text code>storage.cors.json</Text> 안내를 참고하세요.
            </Text>
          }
        />

        <Button
          type="primary"
          icon={<PictureOutlined />}
          loading={isRunning}
          onClick={run}
        >
          {isRunning ? '백필 진행 중…' : '기존 이미지 블러 백필 실행'}
        </Button>

        {showResult && (
          <>
            <Progress
              percent={percent}
              status={isRunning ? 'active' : error ? 'exception' : 'success'}
            />
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="작품 진행">
                {progress.processedWorks} / {progress.totalWorks}
              </Descriptions.Item>
              <Descriptions.Item label="갱신된 작품">{progress.worksUpdated}</Descriptions.Item>
              <Descriptions.Item label="블러 생성">{progress.imagesUpdated}장</Descriptions.Item>
              <Descriptions.Item label="실패">{progress.imagesFailed}장</Descriptions.Item>
              {isRunning && progress.currentTitle && (
                <Descriptions.Item label="현재 작품" span={2}>
                  <Text ellipsis>{progress.currentTitle}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Space>
    </Card>
  );
};

export default BlurBackfillManager;
