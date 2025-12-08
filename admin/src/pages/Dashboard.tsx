// 대시보드 페이지 컴포넌트
import { Card, Row, Col, Typography, Space, Button, List, Avatar } from 'antd';
import { DashboardOutlined, FileTextOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '../hooks/useWorks';
import './Dashboard.css';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();

  // Firebase에서 작업 목록 조회
  const { data: works = [], isLoading } = useWorks();

  // 통계 계산
  const totalWorks = works.length;
  const publishedWorks = works.filter((w) => w.isPublished).length;
  const draftWorks = works.filter((w) => !w.isPublished).length;

  // Date 객체로 변환 (Firebase Timestamp 대응)
  const toDate = (date: Date | { toDate: () => Date }): Date => {
    if (date && typeof (date as { toDate?: () => Date }).toDate === 'function') {
      return (date as { toDate: () => Date }).toDate();
    }
    return date as Date;
  };

  // 최근 수정한 작업 5개 (updatedAt 기준 정렬)
  const recentWorks = [...works]
    .sort((a, b) => toDate(b.updatedAt).getTime() - toDate(a.updatedAt).getTime())
    .slice(0, 5);

  // 시간 경과 표시 함수
  const getTimeAgo = (date: Date | { toDate: () => Date }): string => {
    const d = toDate(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="dashboard">
      <Title level={2}><DashboardOutlined /> 대시보드</Title>

      {/* 통계 카드 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <div className="stat-card">
              <div className="stat-label"><FileTextOutlined /> 전체 작업</div>
              <div className="stat-number">{totalWorks}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="stat-card">
              <div className="stat-label"><CheckCircleOutlined /> 공개</div>
              <div className="stat-number">{publishedWorks}</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div className="stat-card">
              <div className="stat-label"><LockOutlined /> 비공개</div>
              <div className="stat-number">{draftWorks}</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 최근 수정한 작업 */}
      <Card title="최근 수정한 작업" style={{ marginBottom: '24px' }}>
        <List
          dataSource={recentWorks}
          renderItem={(work) => {
            const thumbnailImage = work.images.find((img) => img.id === work.thumbnailImageId);
            return (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => navigate(`/works/${work.id}`)}
                    key="edit"
                  >
                    편집
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      shape="square"
                      size={64}
                      src={thumbnailImage?.thumbnailUrl || thumbnailImage?.url}
                    />
                  }
                  title={work.title}
                  description={
                    <Space direction="vertical" size="small">
                      <span>{(work.shortDescription || work.fullDescription || work.caption || '').substring(0, 50)}...</span>
                      <span style={{ color: '#8c8c8c', fontSize: '12px' }}>
                        {getTimeAgo(work.updatedAt)}
                      </span>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      {/* 빠른 작업 */}
      <Card title="빠른 작업">
        <Space>
          <Button type="primary" onClick={() => navigate('/works/new')}>
            + 새 작업 추가
          </Button>
          <Button onClick={() => navigate('/categories')}>카테고리 관리</Button>
        </Space>
      </Card>
    </div>
  );
};

export default Dashboard;

