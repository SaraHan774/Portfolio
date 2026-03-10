// 카테고리 내 작업 순서 관리 컴포넌트
import { useState, useEffect } from 'react';
import { Card, Button, message, Image, Space } from 'antd';
import {
  DragOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SaveOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { WorkOrder, Work } from '../core/types';

interface WorkOrderManagerProps {
  categoryType: 'keyword' | 'exhibition';
  categoryId: string;
  categoryName: string;
  workOrders: WorkOrder[];
  works: Work[];
  onSave: (workOrders: WorkOrder[]) => Promise<void>;
  onCancel: () => void;
}

const WorkOrderManager = ({
  categoryType,
  categoryId,
  workOrders,
  works,
  onSave,
  onCancel,
}: WorkOrderManagerProps) => {
  const [orderedWorks, setOrderedWorks] = useState<Work[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletedWorksCount, setDeletedWorksCount] = useState(0);

  // 작업 목록 초기화
  useEffect(() => {
    const initialized = initializeWorks();
    setOrderedWorks(initialized);
  }, [categoryId, categoryType, works, workOrders]);

  const initializeWorks = (): Work[] => {
    // Step 1: 카테고리에 속한 작업 필터링 (소스 오브 트루스)
    const worksInCategory = works.filter((w) =>
      categoryType === 'keyword'
        ? w.sentenceCategoryIds.includes(categoryId)
        : w.exhibitionCategoryIds.includes(categoryId)
    );

    // Step 2: 기존 workOrders 처리
    if (workOrders && workOrders.length > 0) {
      // 빠른 조회를 위한 맵 생성
      const workMap = new Map(worksInCategory.map((w) => [w.id, w]));
      const orderedIds = new Set<string>();

      // 첫 번째: workOrders 순서대로 작업 추가 (삭제된 작업 필터링)
      const orderedWorks: Work[] = [];
      let deletedCount = 0;

      workOrders.forEach((wo) => {
        const work = workMap.get(wo.workId);
        if (work) {
          orderedWorks.push(work);
          orderedIds.add(work.id);
        } else {
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        setDeletedWorksCount(deletedCount);
        console.warn(
          `${deletedCount}개의 작업이 삭제되어 순서에서 제외되었습니다.`
        );
      }

      // 두 번째: workOrders에 없는 작업 추가 (새로 카테고리에 추가된 작업)
      const missingWorks = worksInCategory.filter((w) => !orderedIds.has(w.id));
      missingWorks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return [...orderedWorks, ...missingWorks];
    }

    // Step 3: workOrders가 없음 - 기본 정렬 (createdAt 내림차순)
    return worksInCategory.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
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

    // 새로운 순서로 정렬
    const newWorks = [...orderedWorks];
    const draggedItem = newWorks[draggedIndex];
    newWorks.splice(draggedIndex, 1);
    newWorks.splice(dropIndex, 0, draggedItem);

    setOrderedWorks(newWorks);
    setHasChanges(true);
    setDraggedIndex(null);
  };

  // 드래그 종료
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // 위로 이동 (모바일 대체)
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newWorks = [...orderedWorks];
    [newWorks[index - 1], newWorks[index]] = [newWorks[index], newWorks[index - 1]];
    setOrderedWorks(newWorks);
    setHasChanges(true);
  };

  // 아래로 이동 (모바일 대체)
  const handleMoveDown = (index: number) => {
    if (index === orderedWorks.length - 1) return;
    const newWorks = [...orderedWorks];
    [newWorks[index], newWorks[index + 1]] = [newWorks[index + 1], newWorks[index]];
    setOrderedWorks(newWorks);
    setHasChanges(true);
  };

  // 저장
  const handleSave = async () => {
    // 순서 번호 정규화 (1부터 시작하는 연속 번호)
    const newWorkOrders: WorkOrder[] = orderedWorks.map((work, index) => ({
      workId: work.id,
      order: index + 1,
    }));

    // 중복 검증 (방어적 프로그래밍)
    const workIds = new Set<string>();
    for (const wo of newWorkOrders) {
      if (workIds.has(wo.workId)) {
        message.error('중복된 작업이 있습니다. 다시 시도해주세요.');
        return;
      }
      workIds.add(wo.workId);
    }

    setIsLoading(true);
    try {
      await onSave(newWorkOrders);
      setHasChanges(false);
    } catch (error) {
      console.error('작업 순서 저장 실패:', error);
      // 에러는 부모에서 처리
    } finally {
      setIsLoading(false);
    }
  };

  // 취소 (변경사항 확인 없이 바로 닫기)
  const handleCancel = () => {
    onCancel();
  };

  // 썸네일 URL 가져오기
  const getThumbnailUrl = (work: Work): string => {
    const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId);
    return thumbnailImage?.thumbnailUrl || work.images[0]?.thumbnailUrl || '';
  };

  // 빈 목록 처리
  if (orderedWorks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8c8c8c' }}>
        <ExclamationCircleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
        <div>이 카테고리에 속한 작업이 없습니다.</div>
        <Button
          type="default"
          style={{ marginTop: '16px' }}
          onClick={onCancel}
        >
          닫기
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* 안내 메시지 */}
      <div style={{ marginBottom: '16px', fontSize: '13px', color: '#595959' }}>
        <div style={{ marginBottom: '8px' }}>
          드래그하여 작업의 표시 순서를 조정하세요. 또는 화살표 버튼을 사용할 수 있습니다.
        </div>
        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
          {categoryType === 'exhibition'
            ? '💡 순서가 높을수록 프론트에서 오른쪽에서 왼쪽으로 배치됩니다.'
            : '💡 순서대로 프론트에서 왼쪽에서 오른쪽으로 배치됩니다.'}
        </div>
      </div>

      {/* 삭제된 작업 경고 */}
      {deletedWorksCount > 0 && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#fff7e6',
            border: '1px solid #ffd591',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#ad6800',
          }}
        >
          <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
          일부 작업이 삭제되어 순서에서 제외되었습니다 ({deletedWorksCount}개)
        </div>
      )}

      {/* 작업 목록 */}
      <div
        style={{
          maxHeight: '60vh',
          overflowY: 'auto',
          padding: '8px',
          background: '#fafafa',
          borderRadius: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {orderedWorks.map((work, index) => (
            <Card
              key={work.id}
              size="small"
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                cursor: 'move',
                opacity: draggedIndex === index ? 0.5 : 1,
                border:
                  draggedIndex === index
                    ? '2px dashed #1890ff'
                    : '1px solid #d9d9d9',
                transition: 'all 0.2s',
              }}
              bodyStyle={{ padding: '12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 순서 번호 */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    background: '#1890ff',
                    color: 'white',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                {/* 썸네일 */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Image
                    src={getThumbnailUrl(work)}
                    alt={work.title || '제목 없음'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    preview={false}
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                  />
                </div>

                {/* 작업 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {work.title || '제목 없음'}
                  </div>
                  {work.year && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {work.year}년
                    </div>
                  )}
                </div>

                {/* 컨트롤 버튼 */}
                <Space>
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  />
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    onClick={() => handleMoveDown(index)}
                    disabled={index === orderedWorks.length - 1}
                  />
                  <DragOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
                </Space>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 통계 정보 */}
      <div
        style={{
          marginBottom: '16px',
          fontSize: '12px',
          color: '#8c8c8c',
          textAlign: 'center',
        }}
      >
        총 {orderedWorks.length}개의 작업
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button
          icon={<CloseOutlined />}
          onClick={handleCancel}
        >
          취소
        </Button>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          loading={isLoading}
        >
          저장
        </Button>
      </div>
    </div>
  );
};

export default WorkOrderManager;
