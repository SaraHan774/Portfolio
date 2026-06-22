// 이미지 선택 및 관리 컴포넌트 (Storage 업로드는 부모에서 저장 시 수행)
import { useState, useEffect, useRef } from 'react';
import { Upload, Image, Button, Space, Card, message, Switch, Tooltip, Input, Modal, Typography } from 'antd';
import { DragOutlined, CompressOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  RotateRightOutlined,
  UpOutlined,
  DownOutlined,
  BulbOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { WorkImage } from '../core/types';
import { appConfig } from '../core/constants/config';
import './ImageUploader.css';

const { Dragger } = Upload;

/** 로컬에서 아직 업로드 안 된 이미지 (File + 미리보기 URL) */
export interface PendingImage {
  tempId: string;
  file: File;
  previewUrl: string;
  compressOriginal: boolean;
}

interface ImageUploaderProps {
  value?: WorkImage[];
  onChange?: (images: WorkImage[]) => void;
  /** 새로 추가된 파일 (아직 Storage에 업로드 안 됨) */
  onPendingFilesChange?: (pendingImages: PendingImage[]) => void;
  /** 삭제 대기 이미지 (이미 Storage에 있는 것) */
  onPendingDeletes?: (deletedImages: WorkImage[]) => void;
  maxCount?: number;
}

const ImageUploader = ({
  value = [],
  onChange,
  onPendingFilesChange,
  onPendingDeletes,
  maxCount = 50,
}: ImageUploaderProps) => {
  const [images, setImages] = useState<WorkImage[]>(value);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [compressOriginal, setCompressOriginal] = useState(true);

  // value가 변경되면 images도 업데이트
  useEffect(() => {
    setImages(value);
  }, [value]);

  // pending 변경 시 부모에 알림
  useEffect(() => {
    onPendingFilesChange?.(pendingImages);
  }, [pendingImages, onPendingFilesChange]);

  // 컴포넌트 언마운트 시 미사용 blob URL 정리
  const pendingImagesRef = useRef(pendingImages);
  pendingImagesRef.current = pendingImages;
  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    };
  }, []);

  // 파일 선택 핸들러 (Storage 업로드 없이 로컬 미리보기만)
  const handleUpload: UploadProps['customRequest'] = ({ file, onSuccess }) => {
    const uploadFile = file as File;
    const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const previewUrl = URL.createObjectURL(uploadFile);

    const pendingImage: PendingImage = {
      tempId,
      file: uploadFile,
      previewUrl,
      compressOriginal,
    };

    // pending 목록에 추가
    setPendingImages((prev) => [...prev, pendingImage]);

    // 임시 WorkImage를 images 목록에 추가 (미리보기용)
    setImages((prevImages) => {
      const tempWorkImage: WorkImage = {
        id: tempId,
        url: previewUrl,
        thumbnailUrl: previewUrl,
        order: prevImages.length + 1,
        width: 0,
        height: 0,
        fileSize: uploadFile.size,
        uploadedFrom: 'desktop',
      };
      const newImages = [...prevImages, tempWorkImage];
      setTimeout(() => onChange?.(newImages), 0);
      return newImages;
    });

    message.success(`${uploadFile.name} 추가됨 (저장 시 업로드)`);
    onSuccess?.(null);
  };

  // 파일 선택 전 검증
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

  // 이미지 삭제 핸들러 (UI에서만 제거)
  const handleRemove = (imageId: string) => {
    const removedImage = images.find((img) => img.id === imageId);
    const isPending = pendingImages.some((p) => p.tempId === imageId);

    // images 목록에서 제거
    const newImages = images.filter((img) => img.id !== imageId);
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index + 1,
    }));
    setImages(reorderedImages);
    onChange?.(reorderedImages);

    if (isPending) {
      // 아직 업로드 안 된 파일 → pending 목록에서 제거, blob URL 해제
      setPendingImages((prev) => {
        const removed = prev.find((p) => p.tempId === imageId);
        if (removed) URL.revokeObjectURL(removed.previewUrl);
        return prev.filter((p) => p.tempId !== imageId);
      });
    } else if (removedImage) {
      // 이미 Storage에 있는 이미지 → 삭제 대기 목록에 추가
      onPendingDeletes?.([removedImage]);
    }

    message.success('이미지가 목록에서 제거되었습니다.');
  };

  // 이미지 캡션 변경 (상세 화면에서 이미지 아래 표시될 텍스트)
  const handleCaptionChange = (imageId: string, caption: string) => {
    const newImages = images.map((img) =>
      img.id === imageId ? { ...img, caption } : img
    );
    setImages(newImages);
    onChange?.(newImages);
  };

  // 캡션 편집 모달 상태 (편집 중인 이미지 + 임시 입력값)
  const [captionEditing, setCaptionEditing] = useState<{ imageId: string; index: number } | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');

  const openCaptionEditor = (imageId: string, index: number) => {
    const target = images.find((img) => img.id === imageId);
    setCaptionDraft(target?.caption ?? '');
    setCaptionEditing({ imageId, index });
  };

  const closeCaptionEditor = () => setCaptionEditing(null);

  const submitCaptionEditor = () => {
    if (captionEditing) {
      handleCaptionChange(captionEditing.imageId, captionDraft.trim());
    }
    closeCaptionEditor();
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

  // 이미지 회전 핸들러
  const handleRotate = () => {
    message.info('이미지 회전 기능은 서버 연동 후 구현됩니다.');
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

  // pending 여부 확인
  const isPending = (imageId: string) => pendingImages.some((p) => p.tempId === imageId);

  return (
    <div className="image-uploader">
      {/* 원본 압축 옵션 */}
      <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tooltip title="끄면 원본 해상도 그대로 업로드됩니다. 파일 용량이 클 수 있습니다.">
          <Space size="small">
            <CompressOutlined />
            <span style={{ fontSize: '14px' }}>원본 압축 (1920px, WebP)</span>
            <Switch
              size="small"
              checked={compressOriginal}
              onChange={setCompressOriginal}
            />
          </Space>
        </Tooltip>
      </div>

      {/* 업로드 영역 */}
      {images.length < maxCount && (
        <Dragger
          customRequest={handleUpload}
          beforeUpload={beforeUpload}
          fileList={[]}
          multiple
          accept="image/*"
          showUploadList={false}
          capture="environment"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">이미지를 드래그하거나 클릭하여 추가</p>
          <p className="ant-upload-hint">
            최대 {maxCount}장, JPG/PNG, 각 10MB 이하
            <br />
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              저장(게시/임시저장) 시 서버에 업로드됩니다
            </span>
          </p>
        </Dragger>
      )}

      {/* 이미지 개수 표시 */}
      {images.length > 0 && (
        <div className="image-count" style={{ margin: '16px 0', fontWeight: 500 }}>
          이미지 ({images.length}/{maxCount})
          {pendingImages.length > 0 && (
            <span style={{ marginLeft: '8px', color: '#faad14', fontSize: '13px' }}>
              ({pendingImages.length}개 업로드 대기 중)
            </span>
          )}
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
                border: isPending(image.id)
                  ? '2px dashed #faad14'
                  : draggedIndex === index
                    ? '2px dashed #1890ff'
                    : undefined,
              }}
            >
              <div
                className="image-number"
                style={isPending(image.id) ? { background: '#faad14' } : undefined}
              >
                <DragOutlined style={{ marginRight: '4px' }} />
                {isPending(image.id) ? `${index + 1} (대기)` : index + 1}
              </div>
              <div className="image-preview">
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={`이미지 ${index + 1}`}
                  width="100%"
                  height={150}
                  loading="lazy"
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
              <div className="image-caption-area">
                {image.caption ? (
                  <Typography.Paragraph
                    className="image-caption-preview"
                    ellipsis={{ rows: 2, tooltip: image.caption }}
                    title={image.caption}
                  >
                    {image.caption}
                  </Typography.Paragraph>
                ) : (
                  <span className="image-caption-empty">캡션 없음</span>
                )}
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  block
                  onClick={(e) => {
                    e.stopPropagation();
                    openCaptionEditor(image.id, index);
                  }}
                >
                  캡션 편집
                </Button>
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
        <div className="drag-hint" style={{ marginTop: '16px', padding: '12px', background: '#f0f8ff', borderRadius: '4px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BulbOutlined /> 위/아래 버튼으로 순서를 변경할 수 있습니다
        </div>
      )}

      {/* 캡션 편집 모달 */}
      <Modal
        title={captionEditing ? `이미지 #${captionEditing.index + 1} 캡션` : '캡션'}
        open={captionEditing !== null}
        onOk={submitCaptionEditor}
        onCancel={closeCaptionEditor}
        okText="확인"
        cancelText="취소"
        destroyOnClose
      >
        <Input.TextArea
          autoFocus
          placeholder="사진 캡션 (선택, 예: 사진_XXX)"
          maxLength={appConfig.text.imageCaptionMaxLength}
          showCount
          autoSize={{ minRows: 3, maxRows: 8 }}
          value={captionDraft}
          onChange={(e) => setCaptionDraft(e.target.value)}
          onPressEnter={(e) => {
            // Enter=저장, Shift+Enter=줄바꿈
            if (!e.shiftKey) {
              e.preventDefault();
              submitCaptionEditor();
            }
          }}
        />
        <p style={{ marginTop: 8, marginBottom: 0, color: '#8c8c8c', fontSize: 12 }}>
          상세 화면에서 이미지 아래 우측에 표시됩니다. 비워두면 표시되지 않습니다.
        </p>
      </Modal>
    </div>
  );
};

export default ImageUploader;
