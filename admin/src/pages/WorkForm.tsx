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
} from 'antd';
import { SaveOutlined, EyeOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { mockWorks, mockSentenceCategories, mockTextCategories } from '../services/mockData';
import type { WorkImage } from '../types';
import ImageUploader from '../components/ImageUploader';
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
  const [selectedSentenceCategoryIds, setSelectedSentenceCategoryIds] = useState<string[]>([]);
  const [selectedTextCategoryIds, setSelectedTextCategoryIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 모바일 여부 확인
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 작업 데이터 조회 (수정 모드일 때)
  const { data: work, isLoading } = useQuery({
    queryKey: ['work', id],
    queryFn: async () => {
      if (!id) return null;
      return mockWorks.find((w) => w.id === id) || null;
    },
    enabled: !!id,
  });

  // 변경사항 추적
  useEffect(() => {
    if (isEditMode && work) {
      // 폼 값이나 이미지가 변경되었는지 확인
      const formValues = form.getFieldsValue();
      const hasFormChanges =
        formValues.title !== work.title ||
        formValues.shortDescription !== work.shortDescription ||
        formValues.fullDescription !== work.fullDescription ||
        formValues.isPublished !== work.isPublished;
      
      const hasImageChanges =
        images.length !== work.images.length ||
        thumbnailImageId !== work.thumbnailImageId;
      
      const hasCategoryChanges =
        JSON.stringify(selectedSentenceCategoryIds.sort()) !== JSON.stringify(work.sentenceCategoryIds.sort()) ||
        JSON.stringify(selectedTextCategoryIds.sort()) !== JSON.stringify(work.textCategoryIds.sort());
      
      setHasChanges(hasFormChanges || hasImageChanges || hasCategoryChanges);
    } else if (!isEditMode) {
      // 새 작업의 경우 입력값이 있으면 변경사항 있음
      const formValues = form.getFieldsValue();
      setHasChanges(
        !!formValues.title ||
        !!formValues.shortDescription ||
        !!formValues.fullDescription ||
        images.length > 0
      );
    }
  }, [form, images, thumbnailImageId, selectedSentenceCategoryIds, selectedTextCategoryIds, work, isEditMode]);

  // 폼 초기값 설정
  useEffect(() => {
    if (work && isEditMode) {
      form.setFieldsValue({
        title: work.title,
        shortDescription: work.shortDescription,
        fullDescription: work.fullDescription,
        isPublished: work.isPublished,
      });
      setImages(work.images);
      setThumbnailImageId(work.thumbnailImageId);
      setSelectedSentenceCategoryIds(work.sentenceCategoryIds);
      setSelectedTextCategoryIds(work.textCategoryIds);
    }
  }, [work, isEditMode, form]);

  // 저장 핸들러
  const handleSave = async () => {
    try {
      // 이미지 최소 1장 확인
      if (images.length === 0) {
        message.error('최소 1장의 이미지를 업로드해주세요.');
        return;
      }

      // 대표 썸네일 확인
      if (!thumbnailImageId) {
        message.error('대표 썸네일을 선택해주세요.');
        return;
      }

      message.loading({ content: '저장 중...', key: 'save' });
      
      // 실제로는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      message.success({ content: '저장되었습니다.', key: 'save' });
      setHasChanges(false); // 저장 후 변경사항 플래그 초기화
      navigate('/works');
    } catch (error) {
      message.error({ content: '저장 실패', key: 'save' });
    }
  };

  // 임시 저장 핸들러
  const handleDraftSave = async () => {
    try {
      await form.validateFields();
      message.loading({ content: '임시 저장 중...', key: 'draft' });
      
      // 실제로는 API 호출
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      message.success({ content: '임시 저장되었습니다.', key: 'draft' });
      setHasChanges(false); // 임시 저장 후에도 변경사항 플래그 초기화
    } catch (error) {
      message.error({ content: '저장 실패', key: 'draft' });
    }
  };

  // 취소 핸들러 (변경사항 확인)
  const handleCancel = () => {
    if (hasChanges) {
      Modal.confirm({
        title: '저장하지 않은 변경사항이 있습니다.',
        content: '정말 나가시겠습니까?',
        okText: '나가기',
        cancelText: '취소',
        onOk: () => {
          navigate('/works');
        },
        footer: () => (
          <Space>
            <Button onClick={async () => {
              await handleDraftSave();
              navigate('/works');
            }}>
              임시저장
            </Button>
            <Button danger onClick={() => navigate('/works')}>
              나가기
            </Button>
            <Button onClick={() => Modal.destroyAll()}>계속 작업</Button>
          </Space>
        ),
      });
    } else {
      navigate('/works');
    }
  };

  // 미리보기 핸들러
  const handlePreview = () => {
    window.open('/preview', '_blank');
  };

  // 키보드 단축키 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S: 저장
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift + Ctrl/Cmd + S: 임시저장
          handleDraftSave();
        } else {
          // Ctrl/Cmd + S: 저장
          form.submit();
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
  }, [form]);

  if (isEditMode && isLoading) {
    return <div>로딩 중...</div>;
  }

  // Collapse 아이템 정의
  const collapseItems = [
    {
      key: '1',
      label: '📝 기본 정보',
      children: (
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
      ),
    },
    {
      key: '2',
      label: '🖼️ 이미지 관리',
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
      label: '✍️ 이미지 캡션',
      children: (
        <p style={{ color: '#8c8c8c' }}>이미지 캡션 기능은 다음 단계에서 구현됩니다.</p>
      ),
    },
    {
      key: '4',
      label: '📁 카테고리 선택',
      children: (
        <>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '12px', fontWeight: 500 }}>문장형 카테고리</div>
            <div style={{ marginLeft: '16px' }}>
              {mockSentenceCategories.map((sentenceCat) => (
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
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: '12px', fontWeight: 500 }}>텍스트형 카테고리</div>
            <div style={{ marginLeft: '16px' }}>
              <Checkbox.Group
                value={selectedTextCategoryIds}
                onChange={(checkedValues) =>
                  setSelectedTextCategoryIds(checkedValues as string[])
                }
              >
                <Space direction="vertical" size="small">
                  {mockTextCategories.map((textCat) => (
                    <Checkbox key={textCat.id} value={textCat.id}>
                      {textCat.name}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </div>
          </div>
        </>
      ),
    },
  ];

  // 기본 정보는 별도로 표시 (Collapse 밖에서)
  const basicInfoSection = (
    <Card title="📝 기본 정보" style={{ marginBottom: '24px' }}>
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

      <Form.Item name="isPublished" label="공개 상태">
        <Radio.Group>
          <Radio value={true}>공개</Radio>
          <Radio value={false}>비공개</Radio>
        </Radio.Group>
      </Form.Item>
    </Card>
  );

  // 이미지 관리 섹션
  const imageSection = (
    <Card title="🖼️ 이미지 관리" style={{ marginBottom: '24px' }}>
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
    <Card title="📁 카테고리 선택" style={{ marginBottom: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ marginBottom: '12px', fontWeight: 500 }}>문장형 카테고리</div>
        <div style={{ marginLeft: '16px' }}>
          {mockSentenceCategories.map((sentenceCat) => (
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
          ))}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '12px', fontWeight: 500 }}>텍스트형 카테고리</div>
        <div style={{ marginLeft: '16px' }}>
          <Checkbox.Group
            value={selectedTextCategoryIds}
            onChange={(checkedValues) =>
              setSelectedTextCategoryIds(checkedValues as string[])
            }
          >
            <Space direction="vertical" size="small">
              {mockTextCategories.map((textCat) => (
                <Checkbox key={textCat.id} value={textCat.id}>
                  {textCat.name}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="work-form">
      <div className="work-form-header">
        <Title level={2}>
          {isEditMode ? '✏️ 작업 수정' : '➕ 새 작업 추가'}
          {isEditMode && work && `: ${work.title}`}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          isPublished: false,
        }}
      >
        {/* 데스크탑: Card 형식, 모바일: Collapse 형식 */}
        <div className="desktop-sections">
          {basicInfoSection}
          {imageSection}
          <Card title="✍️ 이미지 캡션" style={{ marginBottom: '24px' }}>
            <p style={{ color: '#8c8c8c' }}>이미지 캡션 기능은 다음 단계에서 구현됩니다.</p>
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
            <Button icon={<FileTextOutlined />} onClick={handleDraftSave} block={isMobile}>
              임시저장
            </Button>
            <Button icon={<EyeOutlined />} onClick={handlePreview} block={isMobile}>
              미리보기
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()} block={isMobile}>
              저장
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancel} block={isMobile}>
              취소
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
};

export default WorkForm;
