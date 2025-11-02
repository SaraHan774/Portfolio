// 이미지 업로드 및 관리 컴포넌트
import { useState } from 'react';
import { Upload, Image, Button, Space, Card, message } from 'antd';
import { DragOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  RotateRightOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import type { WorkImage } from '../types';
import './ImageUploader.css';

const { Dragger } = Upload;

interface ImageUploaderProps {
  value?: WorkImage[];
  onChange?: (images: WorkImage[]) => void;
  maxCount?: number;
}

const ImageUploader = ({ value = [], onChange, maxCount = 50 }: ImageUploaderProps) => {
  const [fileList] = useState<UploadFile[]>([]);
  const [images, setImages] = useState<WorkImage[]>(value);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // value가 변경되면 images도 업데이트
  useEffect(() => {
    setImages(value);
  }, [value]);

  // 파일 업로드 핸들러
  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onProgress }) => {
    // 실제로는 서버로 업로드하지만, 여기서는 로컬 URL 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      
      // 이미지 크기 계산
      const img = new window.Image();
      img.onload = () => {
        const newImage: WorkImage = {
          id: `img-${Date.now()}-${Math.random()}`,
          url: imageUrl,
          thumbnailUrl: imageUrl, // 실제로는 서버에서 썸네일 생성
          order: images.length + 1,
          width: img.width,
          height: img.height,
          fileSize: (file as File).size,
        };

        const newImages = [...images, newImage];
        setImages(newImages);
        onChange?.(newImages);

        onSuccess?.(newImage);
      };
      img.src = imageUrl;
    };
    reader.readAsDataURL(file as File);

    // 업로드 진행률 시뮬레이션 (실제로는 서버 응답 기반)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5; // 5-20%씩 증가 (더 자연스러운 진행률)
      if (progress > 95) progress = 95; // 95%까지만 표시
      onProgress?.({ percent: progress } as any);
      if (progress >= 95) {
        clearInterval(interval);
        // 완료 직전 100% 표시
        setTimeout(() => {
          onProgress?.({ percent: 100 } as any);
        }, 200);
      }
    }, 200);
  };

  // 파일 업로드 전 검증
  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('이미지 파일만 업로드 가능합니다.');
      return Upload.LIST_IGNORE;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('이미지는 10MB 이하만 업로드 가능합니다.');
      return Upload.LIST_IGNORE;
    }

    if (images.length >= maxCount) {
      message.error(`최대 ${maxCount}장까지만 업로드 가능합니다.`);
      return Upload.LIST_IGNORE;
    }

    return true;
  };

  // 이미지 삭제 핸들러
  const handleRemove = (imageId: string) => {
    const newImages = images.filter((img) => img.id !== imageId);
    // 순서 재정렬
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index + 1,
    }));
    setImages(reorderedImages);
    onChange?.(reorderedImages);
    message.success('이미지가 삭제되었습니다.');
  };

  // 이미지 순서 변경 (위로)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx + 1,
    }));
    setImages(reorderedImages);
    onChange?.(reorderedImages);
  };

  // 이미지 순서 변경 (아래로)
  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx + 1,
    }));
    setImages(reorderedImages);
    onChange?.(reorderedImages);
  };

  // 이미지 회전 핸들러 (간단한 구현 - 실제로는 서버에서 처리)
  const handleRotate = () => {
    message.info('이미지 회전 기능은 서버 연동 후 구현됩니다.');
    // 실제 구현 시에는 이미지 회전 각도를 상태로 관리하고 서버에 전송
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

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // 순서 재정렬
    const reorderedImages = newImages.map((img, idx) => ({
      ...img,
      order: idx + 1,
    }));

    setImages(reorderedImages);
    onChange?.(reorderedImages);
    setDraggedIndex(null);
    message.success('이미지 순서가 변경되었습니다.');
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="image-uploader">
      {/* 업로드 영역 */}
      {images.length < maxCount && (
        <Dragger
          customRequest={handleUpload}
          beforeUpload={beforeUpload}
          fileList={fileList}
          multiple
          accept="image/*"
          showUploadList={true}
          capture="environment"
          progress={{
            strokeColor: {
              '0%': '#108ee9',
              '100%': '#87d068',
            },
            strokeWidth: 3,
            format: (percent) => `${parseFloat(percent?.toFixed(2) || '0')}%`,
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="ant-upload-hint">
            최대 {maxCount}장, JPG/PNG, 각 10MB 이하
            <br />
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              모바일: 카메라로 촬영하거나 갤러리에서 선택
            </span>
          </p>
        </Dragger>
      )}

      {/* 업로드된 이미지 개수 표시 */}
      {images.length > 0 && (
        <div className="image-count" style={{ margin: '16px 0', fontWeight: 500 }}>
          업로드된 이미지 ({images.length}/{maxCount})
        </div>
      )}

      {/* 이미지 그리드 */}
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((image, index) => (
            <Card
              key={image.id}
              className="image-card"
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
              <div className="image-number">
                <DragOutlined style={{ marginRight: '4px' }} />
                {index + 1}
              </div>
              <div className="image-preview">
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={`이미지 ${index + 1}`}
                  width="100%"
                  height={150}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
              <div className="image-actions">
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
                      disabled={index === images.length - 1}
                    />
                  </Space>
                    <Button
                      size="small"
                      icon={<RotateRightOutlined />}
                      onClick={handleRotate}
                      block
                    >
                      회전
                    </Button>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove(image.id)}
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

      {/* 드래그하여 순서 변경 안내 */}
      {images.length > 1 && (
        <div className="drag-hint" style={{ marginTop: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '4px', fontSize: '14px' }}>
          💡 위/아래 버튼으로 순서를 변경할 수 있습니다
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

