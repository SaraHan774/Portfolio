// 이미지 업로드 및 관리 컴포넌트
import { useState, useEffect, useRef } from 'react';
import { Upload, Image, Button, Space, Card, message, Progress, Spin } from 'antd';
import { DragOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  RotateRightOutlined,
  UpOutlined,
  DownOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import type { WorkImage } from '../types';
import { uploadImage, deleteImage } from '../services/storageService';
import './ImageUploader.css';

const { Dragger } = Upload;

// 업로드 중인 이미지 타입
interface UploadingImage {
  id: string;
  fileName: string;
  progress: number;
  previewUrl: string;
}

interface ImageUploaderProps {
  value?: WorkImage[];
  onChange?: (images: WorkImage[]) => void;
  maxCount?: number;
}

const ImageUploader = ({ value = [], onChange, maxCount = 50 }: ImageUploaderProps) => {
  const [fileList] = useState<UploadFile[]>([]);
  const [images, setImages] = useState<WorkImage[]>(value);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  // 업로드 중인지 추적하여 외부 value 동기화 방지
  const isUploadingRef = useRef(false);

  // value가 변경되면 images도 업데이트 (단, 업로드 중이 아닐 때만)
  useEffect(() => {
    // 업로드 중에는 외부 value로 덮어쓰지 않음
    if (!isUploadingRef.current) {
      setImages(value);
    }
  }, [value]);

  // 파일 업로드 핸들러 (Firebase Storage에 실제 업로드)
  const handleUpload: UploadProps['customRequest'] = async ({ file, onSuccess, onError, onProgress }) => {
    const uploadFile = file as File;
    const uploadId = `uploading-${Date.now()}-${Math.random()}`;

    // 업로드 시작 표시
    isUploadingRef.current = true;

    // 로컬 미리보기 URL 생성
    const previewUrl = URL.createObjectURL(uploadFile);

    // 업로드 중 목록에 추가
    setUploadingImages((prev) => [
      ...prev,
      {
        id: uploadId,
        fileName: uploadFile.name,
        progress: 0,
        previewUrl,
      },
    ]);

    try {
      // Firebase Storage에 업로드
      const uploadedImage = await uploadImage(uploadFile, (progress) => {
        // 진행률 업데이트
        setUploadingImages((prev) =>
          prev.map((img) =>
            img.id === uploadId ? { ...img, progress: Math.round(progress) } : img
          )
        );
        onProgress?.({ percent: progress } as Parameters<NonNullable<typeof onProgress>>[0]);
      });

      // 업로드 완료 - 업로드 중 목록에서 제거
      setUploadingImages((prev) => {
        const newUploadingImages = prev.filter((img) => img.id !== uploadId);
        // 모든 업로드가 완료되면 플래그 해제
        if (newUploadingImages.length === 0) {
          isUploadingRef.current = false;
        }
        return newUploadingImages;
      });
      URL.revokeObjectURL(previewUrl);

      // 업로드된 이미지에 순서 추가 - 함수형 업데이트 사용으로 동시 업로드 버그 해결
      setImages((prevImages) => {
        const newImage: WorkImage = {
          ...uploadedImage,
          order: prevImages.length + 1,
        };
        const newImages = [...prevImages, newImage];
        // onChange는 setTimeout으로 다음 틱에 호출하여 상태 업데이트 완료 후 실행
        setTimeout(() => onChange?.(newImages), 0);
        return newImages;
      });

      message.success('이미지가 업로드되었습니다.');
      onSuccess?.(uploadedImage);
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      // 업로드 실패 - 업로드 중 목록에서 제거
      setUploadingImages((prev) => {
        const newUploadingImages = prev.filter((img) => img.id !== uploadId);
        // 모든 업로드가 완료되면 플래그 해제
        if (newUploadingImages.length === 0) {
          isUploadingRef.current = false;
        }
        return newUploadingImages;
      });
      URL.revokeObjectURL(previewUrl);
      message.error('이미지 업로드에 실패했습니다.');
      onError?.(error as Error);
    }
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

  // 이미지 삭제 핸들러 (Firebase Storage에서도 삭제)
  const handleRemove = async (imageId: string) => {
    try {
      // Firebase Storage에서 삭제
      await deleteImage(imageId);

      const newImages = images.filter((img) => img.id !== imageId);
      // 순서 재정렬
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        order: index + 1,
      }));
      setImages(reorderedImages);
      onChange?.(reorderedImages);
      message.success('이미지가 삭제되었습니다.');
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      // Storage 삭제 실패해도 UI에서는 제거 (이미 업로드 안된 이미지일 수 있음)
      const newImages = images.filter((img) => img.id !== imageId);
      const reorderedImages = newImages.map((img, index) => ({
        ...img,
        order: index + 1,
      }));
      setImages(reorderedImages);
      onChange?.(reorderedImages);
      message.success('이미지가 삭제되었습니다.');
    }
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
      {(images.length > 0 || uploadingImages.length > 0) && (
        <div className="image-count" style={{ margin: '16px 0', fontWeight: 500 }}>
          업로드된 이미지 ({images.length}/{maxCount})
          {uploadingImages.length > 0 && (
            <span style={{ marginLeft: '8px', color: '#1890ff' }}>
              <LoadingOutlined style={{ marginRight: '4px' }} />
              {uploadingImages.length}개 업로드 중...
            </span>
          )}
        </div>
      )}

      {/* 업로드 중인 이미지 표시 */}
      {uploadingImages.length > 0 && (
        <div className="image-grid" style={{ marginBottom: '16px' }}>
          {uploadingImages.map((uploadingImg) => (
            <Card
              key={uploadingImg.id}
              className="image-card uploading-card"
              style={{
                opacity: 0.8,
                border: '2px dashed #1890ff',
              }}
            >
              <div className="image-number" style={{ background: '#1890ff' }}>
                <LoadingOutlined style={{ marginRight: '4px' }} />
                업로드 중
              </div>
              <div className="image-preview" style={{ position: 'relative' }}>
                <img
                  src={uploadingImg.previewUrl}
                  alt="업로드 중"
                  style={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                    borderRadius: '4px',
                    filter: 'brightness(0.7)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'white',
                  }}
                >
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                    {uploadingImg.progress}%
                  </div>
                </div>
              </div>
              <div style={{ padding: '8px' }}>
                <Progress
                  percent={uploadingImg.progress}
                  size="small"
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <div
                  style={{
                    fontSize: '12px',
                    color: '#8c8c8c',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {uploadingImg.fileName}
                </div>
              </div>
            </Card>
          ))}
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
                    onClick={() => void handleRemove(image.id)}
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
        <div className="drag-hint" style={{ marginTop: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BulbOutlined /> 위/아래 버튼으로 순서를 변경할 수 있습니다
        </div>
      )}
    </div>
  );
};

export default ImageUploader;

