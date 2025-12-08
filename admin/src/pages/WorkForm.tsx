// 작업 생성/수정 폼 페이지 컴포넌트
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Typography,
  Form,
  Input,
  Radio,
  Card,
  Button,
  Space,
  message,
  Collapse,
  Checkbox,
  Modal,
  Image,
  Spin,
  notification,
} from 'antd';
import { SaveOutlined, EyeOutlined, CloseOutlined, FileTextOutlined, EditOutlined, PlusOutlined, PictureOutlined, HighlightOutlined, FolderOutlined, ExclamationCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useWork, useCreateWork, useUpdateWork } from '../hooks/useWorks';
import { useSentenceCategories, useExhibitionCategories } from '../hooks/useCategories';
import type { WorkImage } from '../types';
import ImageUploader from '../components/ImageUploader';
import CaptionEditor from '../components/CaptionEditor';
import './WorkForm.css';

const { Title } = Typography;
const { TextArea } = Input;

const WorkForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const isEditMode = !!id;
  const [images, setImages] = useState<WorkImage[]>([]);
  const [thumbnailImageId, setThumbnailImageId] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [selectedSentenceCategoryIds, setSelectedSentenceCategoryIds] = useState<string[]>([]);
  const [selectedExhibitionCategoryIds, setSelectedExhibitionCategoryIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Firebase 데이터 조회
  const { data: work, isLoading } = useWork(id);
  const { data: sentenceCategories = [], isLoading: isSentenceCategoriesLoading } = useSentenceCategories();
  const { data: exhibitionCategories = [], isLoading: isExhibitionCategoriesLoading } = useExhibitionCategories();

  // 저장 mutations
  const createWorkMutation = useCreateWork();
  const updateWorkMutation = useUpdateWork();

  // 변경사항 추적
  useEffect(() => {
    if (isEditMode && work) {
      // 폼 값이나 이미지가 변경되었는지 확인
      const formValues = form.getFieldsValue();
      const hasFormChanges =
        formValues.title !== work.title ||
        formValues.shortDescription !== work.shortDescription ||
        formValues.fullDescription !== work.fullDescription;
      
      const hasImageChanges =
        images.length !== work.images.length ||
        thumbnailImageId !== work.thumbnailImageId;
      
      const hasCaptionChanges = caption !== (work.caption || '');
      
      const hasCategoryChanges =
        JSON.stringify(selectedSentenceCategoryIds.sort()) !== JSON.stringify(work.sentenceCategoryIds.sort()) ||
        JSON.stringify(selectedExhibitionCategoryIds.sort()) !== JSON.stringify(work.exhibitionCategoryIds.sort());

      setHasChanges(hasFormChanges || hasImageChanges || hasCaptionChanges || hasCategoryChanges);
    } else if (!isEditMode) {
      // 새 작업의 경우 입력값이 있으면 변경사항 있음
      const formValues = form.getFieldsValue();
      setHasChanges(
        !!formValues.title ||
        !!formValues.shortDescription ||
        !!formValues.fullDescription ||
        images.length > 0 ||
        !!caption
      );
    }
  }, [form, images, thumbnailImageId, caption, selectedSentenceCategoryIds, selectedExhibitionCategoryIds, work, isEditMode]);

  // 폼 초기값 설정
  useEffect(() => {
    if (work && isEditMode) {
      form.setFieldsValue({
        title: work.title,
        year: work.year,
        shortDescription: work.shortDescription,
        fullDescription: work.fullDescription,
      });
      setImages(work.images);
      setThumbnailImageId(work.thumbnailImageId);
      setCaption(work.caption || '');
      setSelectedSentenceCategoryIds(work.sentenceCategoryIds);
      setSelectedExhibitionCategoryIds(work.exhibitionCategoryIds);
    }
  }, [work, isEditMode, form]);

  // 저장 및 게시 핸들러 (포트폴리오에 공개)
  const handleSave = async () => {
    try {
      // 폼 유효성 검사
      await form.validateFields();

      // 이미지 최소 1장 확인
      if (images.length === 0) {
        notification.warning({
          message: '이미지 필요',
          description: '게시하려면 최소 1장의 이미지를 업로드해주세요.',
          placement: 'topRight',
        });
        return;
      }

      // 대표 썸네일 확인
      if (!thumbnailImageId) {
        notification.warning({
          message: '썸네일 필요',
          description: '게시하려면 대표 썸네일을 선택해주세요.',
          placement: 'topRight',
        });
        return;
      }

      // 로딩 상태 시작
      setIsSaving(true);
      setSavingMessage('포트폴리오에 게시하는 중...');

      const formValues = form.getFieldsValue();

      const workData = {
        title: formValues.title,
        year: formValues.year ? Number(formValues.year) : undefined,
        shortDescription: formValues.shortDescription || '',
        fullDescription: formValues.fullDescription,
        images,
        thumbnailImageId,
        caption,
        sentenceCategoryIds: selectedSentenceCategoryIds,
        exhibitionCategoryIds: selectedExhibitionCategoryIds,
        isPublished: true, // 저장 버튼은 항상 게시 (공개)
      };

      if (isEditMode && id) {
        await updateWorkMutation.mutateAsync({ id, updates: workData });
      } else {
        await createWorkMutation.mutateAsync(workData);
      }

      // 로딩 상태 종료
      setIsSaving(false);
      setSavingMessage('');
      setHasChanges(false);

      // 성공 알림
      notification.success({
        message: '게시 완료',
        description: '작업이 포트폴리오에 게시되었습니다.',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
        duration: 3,
      });

      navigate('/works');
    } catch (error) {
      console.error('게시 실패:', error);
      setIsSaving(false);
      setSavingMessage('');

      // 폼 유효성 검사 실패는 각 필드에 표시되므로 별도 알림 불필요
      if (error && typeof error === 'object' && 'errorFields' in error) {
        return;
      }

      notification.error({
        message: '게시 실패',
        description: '작업 게시에 실패했습니다. 다시 시도해주세요.',
        placement: 'topRight',
      });
    }
  };

  // 임시 저장 핸들러 (비공개 상태로 저장)
  const handleDraftSave = async (navigateAfter = false) => {
    try {
      const formValues = form.getFieldsValue();

      // 제목은 필수
      if (!formValues.title?.trim()) {
        notification.warning({
          message: '제목 필요',
          description: '임시 저장하려면 최소한 제목을 입력해주세요.',
          placement: 'topRight',
        });
        return;
      }

      // 로딩 상태 시작
      setIsSaving(true);
      setSavingMessage('임시 저장하는 중...');

      const workData = {
        title: formValues.title,
        year: formValues.year ? Number(formValues.year) : undefined,
        shortDescription: formValues.shortDescription || '',
        fullDescription: formValues.fullDescription || '',
        images,
        thumbnailImageId: thumbnailImageId || (images.length > 0 ? images[0].id : ''),
        caption,
        sentenceCategoryIds: selectedSentenceCategoryIds,
        exhibitionCategoryIds: selectedExhibitionCategoryIds,
        isPublished: false, // 임시저장은 항상 비공개
      };

      if (isEditMode && id) {
        await updateWorkMutation.mutateAsync({ id, updates: workData });
      } else {
        await createWorkMutation.mutateAsync(workData);
      }

      // 로딩 상태 종료
      setIsSaving(false);
      setSavingMessage('');
      setHasChanges(false);

      // 성공 알림
      notification.success({
        message: '임시 저장 완료',
        description: '작업이 임시 저장되었습니다. (비공개 상태)',
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        placement: 'topRight',
        duration: 3,
      });

      if (navigateAfter) {
        navigate('/works');
      }
    } catch (error) {
      console.error('임시 저장 실패:', error);
      setIsSaving(false);
      setSavingMessage('');

      notification.error({
        message: '임시 저장 실패',
        description: '임시 저장에 실패했습니다. 다시 시도해주세요.',
        placement: 'topRight',
      });
    }
  };

  // 취소 핸들러 (변경사항 확인)
  const handleCancel = () => {
    if (hasChanges) {
      Modal.confirm({
        title: '저장하지 않은 변경사항이 있습니다.',
        icon: <ExclamationCircleOutlined />,
        content: '변경사항을 저장하지 않고 나가시겠습니까?',
        okText: '저장하지 않고 나가기',
        okButtonProps: { danger: true },
        cancelText: '계속 작업',
        onOk: () => {
          navigate('/works');
        },
      });
    } else {
      navigate('/works');
    }
  };

  // 미리보기 핸들러
  const handlePreview = () => {
    const formValues = form.getFieldsValue();

    if (!formValues.title?.trim()) {
      message.warning('미리보기를 위해 최소한 제목을 입력해주세요.');
      return;
    }

    setPreviewVisible(true);
  };

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Ctrl/Cmd + S: 임시저장
          void handleDraftSave(false);
        } else {
          // Ctrl/Cmd + S: 저장
          void handleSave();
        }
      }

      // Ctrl/Cmd + P: 미리보기
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePreview();
      }

      // Esc: 모달 닫기 (이미 Ant Design이 자동 처리)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, images, thumbnailImageId, caption, selectedSentenceCategoryIds, selectedExhibitionCategoryIds, isEditMode, id]);

  // 로딩 상태 처리
  const isDataLoading = (isEditMode && isLoading) || isSentenceCategoriesLoading || isExhibitionCategoriesLoading;

  if (isDataLoading) {
    return <div>로딩 중...</div>;
  }

  // Collapse 아이템 정의
  const collapseItems = [
    {
      key: '1',
      label: (
        <>
          <FileTextOutlined /> 기본 정보
        </>
      ),
      children: (
        <>
          <Form.Item
            name="title"
            label="제목"
            rules={[
              { required: true, message: '제목을 입력해주세요.' },
              { max: 100, message: '제목은 100자 이하로 입력해주세요.' },
            ]}
          >
            <Input placeholder="작업 제목을 입력하세요" maxLength={100} showCount />
          </Form.Item>
          <Form.Item
            name="year"
            label="제작 년도"
            rules={[
              {
                validator: (_, value) => {
                  if (value && (value < 1900 || value > new Date().getFullYear() + 1)) {
                    return Promise.reject(new Error('유효한 년도를 입력해주세요.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              placeholder={`예: ${new Date().getFullYear()}`}
              style={{ width: '150px' }}
            />
          </Form.Item>
        </>
      ),
    },
    {
      key: '2',
      label: (
        <>
          <PictureOutlined /> 이미지 관리
        </>
      ),
      children: (
        <>
          <Form.Item
            rules={[
              {
                validator: () => {
                  if (images.length === 0) {
                    return Promise.reject(new Error('최소 1장의 이미지를 업로드해주세요.'));
                  }
                  if (!thumbnailImageId) {
                    return Promise.reject(new Error('대표 썸네일을 선택해주세요.'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <ImageUploader
              value={images}
              onChange={(newImages) => {
                setImages(newImages);
                if (newImages.length > 0 && !newImages.find((img) => img.id === thumbnailImageId)) {
                  setThumbnailImageId(newImages[0].id);
                }
              }}
              maxCount={50}
            />
          </Form.Item>
          {images.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ marginBottom: '8px', fontWeight: 500 }}>대표 썸네일 선택:</div>
              <Radio.Group
                value={thumbnailImageId}
                onChange={(e) => setThumbnailImageId(e.target.value)}
              >
                <Space wrap>
                  {images.map((image) => (
                    <Radio key={image.id} value={image.id}>
                      이미지 {image.order}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          )}
        </>
      ),
    },
    {
      key: '3',
      label: (
        <>
          <HighlightOutlined /> 상세 페이지 캡션
        </>
      ),
      children: (
        <>
          {images.length === 0 ? (
            <p style={{ color: '#8c8c8c' }}>먼저 이미지를 업로드해주세요.</p>
          ) : (
            <CaptionEditor
              value={caption}
              onChange={(html) => setCaption(html)}
            />
          )}
        </>
      ),
    },
    {
      key: '4',
      label: (
        <>
          <FolderOutlined /> 카테고리 선택
        </>
      ),
      children: (
        <>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 500 }}>문장형 카테고리</div>
            <div style={{ marginLeft: '16px' }}>
              {sentenceCategories.length === 0 ? (
                <p style={{ color: '#8c8c8c' }}>등록된 문장형 카테고리가 없습니다.</p>
              ) : (
                sentenceCategories.map((sentenceCat) => (
                  <div key={sentenceCat.id} style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                      "{sentenceCat.sentence}"
                    </div>
                    <Checkbox.Group
                      value={selectedSentenceCategoryIds}
                      onChange={(checkedValues) =>
                        setSelectedSentenceCategoryIds(checkedValues as string[])
                      }
                    >
                      <Space direction="vertical" size="small">
                        {sentenceCat.keywords.map((keyword) => (
                          <Checkbox key={keyword.id} value={keyword.id}>
                            {keyword.name}{' '}
                            <span style={{ color: '#8c8c8c' }}>({sentenceCat.sentence})</span>
                          </Checkbox>
                        ))}
                      </Space>
                    </Checkbox.Group>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '12px', fontWeight: 500 }}>전시명 카테고리</div>
            <div style={{ marginLeft: '16px' }}>
              {exhibitionCategories.length === 0 ? (
                <p style={{ color: '#8c8c8c' }}>등록된 전시명 카테고리가 없습니다.</p>
              ) : (
                <Checkbox.Group
                  value={selectedExhibitionCategoryIds}
                  onChange={(checkedValues) =>
                    setSelectedExhibitionCategoryIds(checkedValues as string[])
                  }
                >
                  <Space direction="vertical" size="small">
                    {exhibitionCategories.map((exhibitionCat) => (
                      <Checkbox key={exhibitionCat.id} value={exhibitionCat.id}>
                        <span style={{ fontWeight: 500 }}>{exhibitionCat.title}</span>
                        <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>
                          | {exhibitionCat.description.exhibitionType}, {exhibitionCat.description.venue}, {exhibitionCat.description.year}
                        </span>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              )}
            </div>
          </div>
        </>
      ),
    },
  ];

  // 기본 정보는 별도로 표시 (Collapse 밖에서)
  const basicInfoSection = (
    <Card title={<><FileTextOutlined /> 기본 정보</>} style={{ marginBottom: '24px' }}>
      <Form.Item
        name="title"
        label="제목"
        rules={[
          { required: true, message: '제목을 입력해주세요.' },
          { max: 100, message: '제목은 100자 이하로 입력해주세요.' },
        ]}
      >
        <Input placeholder="작업 제목을 입력하세요" maxLength={100} showCount />
      </Form.Item>

      <Form.Item
        name="year"
        label="제작 년도"
        rules={[
          {
            validator: (_, value) => {
              if (value && (value < 1900 || value > new Date().getFullYear() + 1)) {
                return Promise.reject(new Error('유효한 년도를 입력해주세요.'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input
          type="number"
          placeholder={`예: ${new Date().getFullYear()}`}
          style={{ width: '150px' }}
        />
      </Form.Item>

      <Form.Item
        name="shortDescription"
        label="간단한 설명 (선택)"
        rules={[{ max: 200, message: '간단한 설명은 200자 이하로 입력해주세요.' }]}
      >
        <Input
          placeholder="카드에 표시될 간단한 설명"
          maxLength={200}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="fullDescription"
        label="상세 설명"
        rules={[
          { required: true, message: '상세 설명을 입력해주세요.' },
          { max: 5000, message: '상세 설명은 5000자 이하로 입력해주세요.' },
        ]}
      >
        <TextArea
          placeholder="작업에 대한 상세한 설명을 입력하세요"
          rows={8}
          maxLength={5000}
          showCount
        />
      </Form.Item>

      <Form.Item label="게시 상태">
        <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: '6px' }}>
          {isEditMode && work ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: work.isPublished ? '#52c41a' : '#faad14',
                }}
              />
              <span style={{ fontWeight: 500 }}>
                현재: {work.isPublished ? '게시됨 (포트폴리오에 공개)' : '미게시 (비공개)'}
              </span>
            </div>
          ) : (
            <span style={{ color: '#8c8c8c' }}>새 작업 (저장 전)</span>
          )}
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
            • <strong>임시저장</strong>: 비공개로 저장 (포트폴리오에 표시되지 않음)<br />
            • <strong>게시</strong>: 포트폴리오에 공개
          </div>
        </div>
      </Form.Item>
    </Card>
  );

  // 이미지 관리 섹션
  const imageSection = (
    <Card title={<><PictureOutlined /> 이미지 관리</>} style={{ marginBottom: '24px' }}>
      <Form.Item
        rules={[
          {
            validator: () => {
              if (images.length === 0) {
                return Promise.reject(new Error('최소 1장의 이미지를 업로드해주세요.'));
              }
              if (!thumbnailImageId) {
                return Promise.reject(new Error('대표 썸네일을 선택해주세요.'));
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <ImageUploader
          value={images}
          onChange={(newImages) => {
            setImages(newImages);
            if (newImages.length > 0 && !newImages.find((img) => img.id === thumbnailImageId)) {
              setThumbnailImageId(newImages[0].id);
            }
          }}
          maxCount={50}
        />
      </Form.Item>
      
      {images.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ marginBottom: '8px', fontWeight: 500 }}>대표 썸네일 선택:</div>
          <Radio.Group
            value={thumbnailImageId}
            onChange={(e) => setThumbnailImageId(e.target.value)}
          >
            <Space wrap>
              {images.map((image) => (
                <Radio key={image.id} value={image.id}>
                  이미지 {image.order}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
      )}
    </Card>
  );

  // 카테고리 선택 섹션
  const categorySection = (
    <Card title={<><FolderOutlined /> 카테고리 선택</>} style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '12px', fontWeight: 500 }}>문장형 카테고리</div>
        <div style={{ marginLeft: '16px' }}>
          {sentenceCategories.length === 0 ? (
            <p style={{ color: '#8c8c8c' }}>등록된 문장형 카테고리가 없습니다.</p>
          ) : (
            sentenceCategories.map((sentenceCat) => (
              <div key={sentenceCat.id} style={{ marginBottom: '16px' }}>
                <div style={{ marginBottom: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                  "{sentenceCat.sentence}"
                </div>
                <Checkbox.Group
                  value={selectedSentenceCategoryIds}
                  onChange={(checkedValues) =>
                    setSelectedSentenceCategoryIds(checkedValues as string[])
                  }
                >
                  <Space direction="vertical" size="small">
                    {sentenceCat.keywords.map((keyword) => (
                      <Checkbox key={keyword.id} value={keyword.id}>
                        {keyword.name}{' '}
                        <span style={{ color: '#8c8c8c' }}>({sentenceCat.sentence})</span>
                      </Checkbox>
                    ))}
                  </Space>
                </Checkbox.Group>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '12px', fontWeight: 500 }}>전시명 카테고리</div>
        <div style={{ marginLeft: '16px' }}>
          {exhibitionCategories.length === 0 ? (
            <p style={{ color: '#8c8c8c' }}>등록된 전시명 카테고리가 없습니다.</p>
          ) : (
            <Checkbox.Group
              value={selectedExhibitionCategoryIds}
              onChange={(checkedValues) =>
                setSelectedExhibitionCategoryIds(checkedValues as string[])
              }
            >
              <Space direction="vertical" size="small">
                {exhibitionCategories.map((exhibitionCat) => (
                  <Checkbox key={exhibitionCat.id} value={exhibitionCat.id}>
                    <span style={{ fontWeight: 500 }}>{exhibitionCat.title}</span>
                    <span style={{ color: '#8c8c8c', marginLeft: '8px' }}>
                      | {exhibitionCat.description.exhibitionType}, {exhibitionCat.description.venue}, {exhibitionCat.description.year}
                    </span>
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="work-form">
      {/* 저장 중 로딩 오버레이 */}
      {isSaving && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Spin
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
          />
          <div style={{ marginTop: '24px', fontSize: '18px', color: '#1890ff', fontWeight: 500 }}>
            {savingMessage}
          </div>
          <div style={{ marginTop: '8px', fontSize: '14px', color: '#8c8c8c' }}>
            잠시만 기다려주세요...
          </div>
        </div>
      )}

      <div className="work-form-header">
        <Title level={2}>
          {isEditMode ? (
            <>
              <EditOutlined /> 작업 수정
            </>
          ) : (
            <>
              <PlusOutlined /> 새 작업 추가
            </>
          )}
          {isEditMode && work && `: ${work.title}`}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        {/* 데스크탑: Card 형식, 모바일: Collapse 형식 */}
        <div className="desktop-sections">
          {basicInfoSection}
          {imageSection}
          <Card title={<><HighlightOutlined /> 상세 페이지 캡션</>} style={{ marginBottom: '24px' }}>
            {images.length === 0 ? (
              <p style={{ color: '#8c8c8c' }}>먼저 이미지를 업로드해주세요.</p>
            ) : (
              <CaptionEditor
                value={caption}
                onChange={(html) => setCaption(html)}
              />
            )}
          </Card>
          {categorySection}
        </div>

        <div className="mobile-sections">
          <Collapse defaultActiveKey={['1', '2', '3', '4']} items={collapseItems} />
        </div>

        {/* 하단 액션 버튼 */}
        <div className="work-form-actions">
          <Space
            className="work-form-actions-space"
            direction={isMobile ? 'vertical' : 'horizontal'}
            style={{ width: '100%' }}
            size={isMobile ? 'middle' : 'small'}
          >
            <Button
              icon={<FileTextOutlined />}
              onClick={() => void handleDraftSave(false)}
              block={isMobile}
              loading={isSaving}
              disabled={isSaving}
            >
              임시저장
            </Button>
            <Button
              icon={<EyeOutlined />}
              onClick={handlePreview}
              block={isMobile}
              disabled={isSaving}
            >
              미리보기
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => void handleSave()}
              block={isMobile}
              loading={isSaving}
              disabled={isSaving}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              게시
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={handleCancel}
              block={isMobile}
              disabled={isSaving}
            >
              취소
            </Button>
          </Space>
        </div>
      </Form>

      {/* 미리보기 모달 */}
      <Modal
        title="작업 미리보기"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            닫기
          </Button>,
        ]}
        width={800}
      >
        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* 제목 및 년도 */}
          <Typography.Title level={3}>
            {form.getFieldValue('title') || '(제목 없음)'}
            {form.getFieldValue('year') && (
              <span style={{ fontWeight: 'normal', fontSize: '18px', color: '#8c8c8c', marginLeft: '12px' }}>
                ({form.getFieldValue('year')})
              </span>
            )}
          </Typography.Title>

          {/* 게시 상태 */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{
              padding: '4px 8px',
              borderRadius: '4px',
              background: (isEditMode && work?.isPublished) ? '#52c41a' : '#faad14',
              color: 'white',
              fontSize: '12px'
            }}>
              {(isEditMode && work?.isPublished) ? '게시됨' : '미게시 (임시저장하면 비공개, 게시하면 공개)'}
            </span>
          </div>

          {/* 간단한 설명 */}
          {form.getFieldValue('shortDescription') && (
            <Typography.Paragraph type="secondary">
              {form.getFieldValue('shortDescription')}
            </Typography.Paragraph>
          )}

          {/* 이미지 */}
          {images.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <Typography.Title level={5}>이미지 ({images.length}장)</Typography.Title>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {images.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      border: img.id === thumbnailImageId ? '3px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: '4px',
                      padding: '2px'
                    }}
                  >
                    <Image
                      src={img.thumbnailUrl || img.url}
                      alt={`이미지 ${img.order}`}
                      width={100}
                      height={100}
                      style={{ objectFit: 'cover' }}
                    />
                    {img.id === thumbnailImageId && (
                      <div style={{ textAlign: 'center', fontSize: '10px', color: '#1890ff' }}>
                        대표
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 상세 설명 */}
          {form.getFieldValue('fullDescription') && (
            <div style={{ marginBottom: '24px' }}>
              <Typography.Title level={5}>상세 설명</Typography.Title>
              <Typography.Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {form.getFieldValue('fullDescription')}
              </Typography.Paragraph>
            </div>
          )}

          {/* 캡션 */}
          {caption && (
            <div style={{ marginBottom: '24px' }}>
              <Typography.Title level={5}>캡션</Typography.Title>
              <div
                dangerouslySetInnerHTML={{ __html: caption }}
                style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}
              />
            </div>
          )}

          {/* 선택된 카테고리 */}
          <div>
            <Typography.Title level={5}>선택된 카테고리</Typography.Title>
            {selectedSentenceCategoryIds.length === 0 && selectedExhibitionCategoryIds.length === 0 ? (
              <Typography.Text type="secondary">선택된 카테고리가 없습니다.</Typography.Text>
            ) : (
              <>
                {selectedSentenceCategoryIds.length > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>문장형 키워드:</strong>{' '}
                    {sentenceCategories
                      .flatMap((cat) => cat.keywords)
                      .filter((kw) => selectedSentenceCategoryIds.includes(kw.id))
                      .map((kw) => kw.name)
                      .join(', ') || '없음'}
                  </div>
                )}
                {selectedExhibitionCategoryIds.length > 0 && (
                  <div>
                    <strong>전시명:</strong>{' '}
                    {exhibitionCategories
                      .filter((cat) => selectedExhibitionCategoryIds.includes(cat.id))
                      .map((cat) => cat.title)
                      .join(', ') || '없음'}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkForm;
