// YouTube 영상 추가 컴포넌트
import { useState, useEffect } from 'react';
import { Modal, Input, Button, message, Card, Space, Form } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DragOutlined,
  UpOutlined,
  DownOutlined,
  YoutubeOutlined,
} from '@ant-design/icons';
import type { WorkVideo } from '../core/types';
import { extractYouTubeVideoId, createYouTubeEmbedUrl } from '../core/utils/string';

interface VideoUploaderProps {
  value?: WorkVideo[];
  onChange?: (videos: WorkVideo[]) => void;
  maxCount?: number;
}

const VideoUploader = ({ value = [], onChange, maxCount = 10 }: VideoUploaderProps) => {
  const [videos, setVideos] = useState<WorkVideo[]>(value);
  const [modalVisible, setModalVisible] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [previewVideoId, setPreviewVideoId] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // value prop이 변경될 때 내부 상태 동기화 (Firebase에서 데이터 로드 시)
  useEffect(() => {
    setVideos(value);
  }, [value]);

  // 모달 열기
  const handleOpenModal = () => {
    setYoutubeUrl('');
    setVideoTitle('');
    setPreviewVideoId(null);
    setModalVisible(true);
  };

  // URL 입력 시 미리보기 업데이트
  const handleUrlChange = (url: string) => {
    setYoutubeUrl(url);
    const videoId = extractYouTubeVideoId(url);
    setPreviewVideoId(videoId);
  };

  // 영상 추가
  const handleAddVideo = () => {
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      message.error('유효한 YouTube URL을 입력해주세요.');
      return;
    }

    if (videos.length >= maxCount) {
      message.error(`최대 ${maxCount}개까지만 추가할 수 있습니다.`);
      return;
    }

    const newVideo: WorkVideo = {
      id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      youtubeUrl: youtubeUrl,
      youtubeVideoId: videoId,
      embedUrl: createYouTubeEmbedUrl(videoId),
      ...(videoTitle ? { title: videoTitle } : {}),
      order: videos.length + 1,
    };

    const newVideos = [...videos, newVideo];
    setVideos(newVideos);
    onChange?.(newVideos);
    setModalVisible(false);
    message.success('영상이 추가되었습니다.');
  };

  // 영상 삭제
  const handleRemove = (videoId: string) => {
    const newVideos = videos.filter((v) => v.id !== videoId);
    // 순서 재정렬
    const reorderedVideos = newVideos.map((v, index) => ({
      ...v,
      order: index + 1,
    }));
    setVideos(reorderedVideos);
    onChange?.(reorderedVideos);
    message.success('영상이 삭제되었습니다.');
  };

  // 영상 순서 변경 (위로)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index - 1], newVideos[index]] = [newVideos[index], newVideos[index - 1]];
    const reorderedVideos = newVideos.map((v, idx) => ({
      ...v,
      order: idx + 1,
    }));
    setVideos(reorderedVideos);
    onChange?.(reorderedVideos);
  };

  // 영상 순서 변경 (아래로)
  const handleMoveDown = (index: number) => {
    if (index === videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
    const reorderedVideos = newVideos.map((v, idx) => ({
      ...v,
      order: idx + 1,
    }));
    setVideos(reorderedVideos);
    onChange?.(reorderedVideos);
  };

  // 드래그 시작
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  // 드래그 오버
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 드롭 처리
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newVideos = [...videos];
    const draggedVideo = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(dropIndex, 0, draggedVideo);

    const reorderedVideos = newVideos.map((v, idx) => ({
      ...v,
      order: idx + 1,
    }));

    setVideos(reorderedVideos);
    onChange?.(reorderedVideos);
    setDraggedIndex(null);
    message.success('영상 순서가 변경되었습니다.');
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="video-uploader">
      {/* 영상 추가 버튼 */}
      {videos.length < maxCount && (
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={handleOpenModal}
          style={{ marginBottom: '16px' }}
        >
          YouTube 영상 추가
        </Button>
      )}

      {/* 영상 개수 표시 */}
      {videos.length > 0 && (
        <div style={{ marginBottom: '16px', fontWeight: 500 }}>
          추가된 영상 ({videos.length}/{maxCount})
        </div>
      )}

      {/* 영상 그리드 */}
      {videos.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          {videos.map((video, index) => (
            <Card
              key={video.id}
              size="small"
              hoverable
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                cursor: 'move',
                opacity: draggedIndex === index ? 0.5 : 1,
                border: draggedIndex === index ? '2px dashed #1890ff' : undefined,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(255, 0, 0, 0.8)',
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  zIndex: 1,
                }}
              >
                <DragOutlined style={{ marginRight: '4px' }} />
                영상 {index + 1}
              </div>

              {/* YouTube 썸네일 */}
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%', // 16:9 비율
                  background: '#000',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={`https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
                  alt={video.title || 'YouTube 영상'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // 썸네일 로드 실패 시 기본 이미지로 대체
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Zb3VUdWJlIOyYgeyDgTwvdGV4dD48L3N2Zz4=';
                  }}
                />
                <PlayCircleOutlined
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '48px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                />
              </div>

              {/* 영상 제목 */}
              {video.title && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {video.title}
                </div>
              )}

              {/* 액션 버튼 */}
              <div style={{ marginTop: '8px' }}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Space size="small" style={{ width: '100%' }}>
                    <Button
                      size="small"
                      icon={<UpOutlined />}
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    />
                    <Button
                      size="small"
                      icon={<DownOutlined />}
                      onClick={() => handleMoveDown(index)}
                      disabled={index === videos.length - 1}
                    />
                  </Space>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(video.id)}
                    block
                  >
                    삭제
                  </Button>
                </Space>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 영상 추가 모달 */}
      <Modal
        title={
          <>
            <YoutubeOutlined style={{ color: '#ff0000', marginRight: '8px' }} />
            YouTube 영상 추가
          </>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleAddVideo}
        okText="추가"
        cancelText="취소"
        okButtonProps={{ disabled: !previewVideoId }}
      >
        <Form layout="vertical">
          <Form.Item
            label="YouTube URL"
            required
            help="예: https://www.youtube.com/watch?v=xxx 또는 https://youtu.be/xxx"
          >
            <Input
              placeholder="YouTube URL을 입력하세요"
              value={youtubeUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
          </Form.Item>

          <Form.Item label="영상 제목 (선택)">
            <Input
              placeholder="영상 제목을 입력하세요"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
          </Form.Item>

          {/* 미리보기 */}
          {previewVideoId && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 500 }}>미리보기:</div>
              <div
                style={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  background: '#000',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${previewVideoId}`}
                  title="YouTube 미리보기"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default VideoUploader;