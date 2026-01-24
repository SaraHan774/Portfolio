// 대시보드 페이지 컴포넌트
import { Card, Row, Col, Typography, Space, Button, List, Avatar, Statistic, Table, Spin, Alert } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  LockOutlined,
  UserOutlined,
  EyeOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorks } from '../domain';
import { useDailyVisitors, usePageStats } from '../domain/hooks/useAnalytics';
import './Dashboard.css';

const { Title } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();

  // Firebase에서 작업 목록 조회
  const { data: works = [], isLoading } = useWorks();

  // Analytics 데이터 조회 (최근 7일)
  const { data: dailyVisitors, isLoading: isLoadingDaily, error: dailyError } = useDailyVisitors(7);
  const { data: pageStats, isLoading: isLoadingPages, error: pagesError } = usePageStats(7, 5);

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

      {/* Analytics 통계 (최근 7일) */}
      <Card title="🔥 방문자 통계 (최근 7일)" style={{ marginBottom: '24px' }}>
        {dailyError ? (
          <Alert
            message="Analytics 데이터를 불러올 수 없습니다"
            description="Cloud Functions가 배포되지 않았거나 환경변수가 설정되지 않았습니다. docs/CLOUD_FUNCTIONS_SETUP.md를 참고하세요."
            type="warning"
            showIcon
          />
        ) : isLoadingDaily ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" tip="Analytics 데이터 로딩 중..." />
          </div>
        ) : (
          <>
            {/* GA4 데이터 갱신 주기 안내 */}
            <Alert
              message="📊 데이터 갱신 주기 안내"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>통계 데이터:</strong> 24-48시간 지연
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    GA4는 Attribution 모델링을 위해 데이터를 더 정확하게 처리하므로 일반 보고서는 최대 48시간이 소요될 수 있습니다.{' '}
                    <a
                      href="https://support.google.com/analytics/answer/11198161"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      자세히 보기 →
                    </a>
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
              closable
            />

            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="총 방문자"
                    value={dailyVisitors?.summary.totalUsers || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="총 페이지뷰"
                    value={dailyVisitors?.summary.totalPageViews || 0}
                    prefix={<EyeOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="평균 일일 방문자"
                    value={dailyVisitors?.summary.averageUsersPerDay || 0}
                    prefix={<RiseOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* 인기 페이지 */}
            {!pagesError && !isLoadingPages && pageStats && (
              <div style={{ marginTop: '16px' }}>
                <Typography.Title level={5}>인기 페이지 TOP 5</Typography.Title>
                <Table
                  dataSource={pageStats.pageStats}
                  rowKey="path"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: '페이지',
                      dataIndex: 'title',
                      key: 'title',
                      render: (title: string, record) => (
                        <div>
                          <div style={{ fontWeight: 500 }}>{title || '(제목 없음)'}</div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.path}</div>
                        </div>
                      ),
                    },
                    {
                      title: '페이지뷰',
                      dataIndex: 'pageViews',
                      key: 'pageViews',
                      width: 120,
                      align: 'right',
                    },
                    {
                      title: '순 방문자',
                      dataIndex: 'activeUsers',
                      key: 'activeUsers',
                      width: 120,
                      align: 'right',
                    },
                  ]}
                />
              </div>
            )}

            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <Button
                type="link"
                href="https://analytics.google.com"
                target="_blank"
              >
                Google Analytics에서 상세 분석 보기 →
              </Button>
            </div>
          </>
        )}
      </Card>

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

