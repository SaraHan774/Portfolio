// 이미지와 영상의 통합 순서 관리 컴포넌트
import { useState, useEffect } from 'react';
import { Card, message } from 'antd';
import {
  DragOutlined,
  PictureOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import type { WorkImage, WorkVideo, MediaItem } from '../core/types';

interface MediaOrderManagerProps {
  images: WorkImage[];
  videos: WorkVideo[];
  onOrderChange: (images: WorkImage[], videos: WorkVideo[]) => void;
}

const MediaOrderManager = ({ images, videos, onOrderChange }: MediaOrderManagerProps) => {
  // 통합 미디어 목록 생성
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // 이미지와 영상을 통합 목록으로 변환
  useEffect(() => {
    const allMedia: MediaItem[] = [
      ...images.map((img) => ({ type: 'image' as const, data: img })),
      ...videos.map((vid) => ({ type: 'video' as const, data: vid })),
    ];

    // order 기준으로 정렬
    allMedia.sort((a, b) => a.data.order - b.data.order);
    setMediaItems(allMedia);
  }, [images, videos]);

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

    // 새로운 순서로 정렬
    const newMediaItems = [...mediaItems];
    const draggedItem = newMediaItems[draggedIndex];
    newMediaItems.splice(draggedIndex, 1);
    newMediaItems.splice(dropIndex, 0, draggedItem);

    // order 값 재할당 (타입별로 처리)
    const reorderedItems: MediaItem[] = newMediaItems.map((item, index) => {
      if (item.type === 'image') {
        return {
          type: 'image' as const,
          data: { ...item.data, order: index + 1 },
        };
      } else {
        return {
          type: 'video' as const,
          data: { ...item.data, order: index + 1 },
        };
      }
    });

    setMediaItems(reorderedItems);

    // 이미지와 영상을 분리하여 부모에게 전달
    const newImages = reorderedItems
      .filter((item): item is { type: 'image'; data: WorkImage } => item.type === 'image')
      .map((item) => item.data);

    const newVideos = reorderedItems
      .filter((item): item is { type: 'video'; data: WorkVideo } => item.type === 'video')
      .map((item) => item.data);

    onOrderChange(newImages, newVideos);
    setDraggedIndex(null);
    message.success('미디어 순서가 변경되었습니다.');
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (mediaItems.length === 0) {
    return null;
  }

  return (
    <Card
      title={<><DragOutlined /> 미디어 순서 관리</>}
      size="small"
      style={{ marginBottom: '24px' }}
    >
      <div style={{ marginBottom: '12px', fontSize: '12px', color: '#8c8c8c' }}>
        드래그하여 이미지와 영상의 표시 순서를 조정하세요. 상세 페이지에서 이 순서대로 표시됩니다.
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '8px',
          background: '#fafafa',
          borderRadius: '8px',
          minHeight: '100px',
        }}
      >
        {mediaItems.map((item, index) => (
          <div
            key={`${item.type}-${item.data.id}`}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            style={{
              position: 'relative',
              width: '80px',
              height: '80px',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'move',
              opacity: draggedIndex === index ? 0.5 : 1,
              border: draggedIndex === index ? '2px dashed #1890ff' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {/* 순서 번호 배지 */}
            <div
              style={{
                position: 'absolute',
                top: '4px',
                left: '4px',
                background: item.type === 'image' ? '#1890ff' : '#ff0000',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                zIndex: 2,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
              }}
            >
              {item.type === 'image' ? (
                <PictureOutlined style={{ fontSize: '10px' }} />
              ) : (
                <PlayCircleOutlined style={{ fontSize: '10px' }} />
              )}
              {index + 1}
            </div>

            {/* 썸네일 */}
            {item.type === 'image' ? (
              <img
                src={(item.data as WorkImage).thumbnailUrl || (item.data as WorkImage).url}
                alt={`이미지 ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  src={`https://img.youtube.com/vi/${(item.data as WorkVideo).youtubeVideoId}/mqdefault.jpg`}
                  alt={`영상 ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                <PlayCircleOutlined
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '24px',
                    color: 'rgba(255, 255, 255, 0.9)',
                    textShadow: '0 0 4px rgba(0,0,0,0.5)',
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '12px', fontSize: '11px', color: '#8c8c8c' }}>
        <PictureOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
        이미지 {images.length}개
        <span style={{ margin: '0 8px' }}>|</span>
        <PlayCircleOutlined style={{ color: '#ff0000', marginRight: '4px' }} />
        영상 {videos.length}개
        <span style={{ margin: '0 8px' }}>|</span>
        총 {mediaItems.length}개
      </div>
    </Card>
  );
};

export default MediaOrderManager;
