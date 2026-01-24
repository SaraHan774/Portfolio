import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

// Firebase Admin 초기화
admin.initializeApp();

// 환경변수
const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || '';
const GA4_SERVICE_ACCOUNT_KEY = process.env.GA4_SERVICE_ACCOUNT_KEY || '';

/**
 * GA4 Analytics 클라이언트 생성
 */
const getAnalyticsClient = async () => {
  if (!GA4_SERVICE_ACCOUNT_KEY) {
    throw new Error('GA4_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(GA4_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  });

  return google.analyticsdata({
    version: 'v1beta',
    auth,
  });
};

/**
 * 일일 방문자 수 조회
 * GET /getDailyVisitors?days=7
 */
export const getDailyVisitors = functions
  .region('asia-northeast3')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const days = parseInt(req.query.days as string) || 7;

      if (!GA4_PROPERTY_ID) {
        res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
        return;
      }

      const analyticsData = await getAnalyticsClient();

      const response: any = await analyticsData.properties.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [
            { name: 'activeUsers' },
            { name: 'screenPageViews' },
          ],
          orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
        },
      });

      const dailyStats = response.data.rows?.map((row: any) => ({
        date: row.dimensionValues?.[0].value || '',
        activeUsers: parseInt(row.metricValues?.[0].value || '0'),
        pageViews: parseInt(row.metricValues?.[1].value || '0'),
      })) || [];

      const totalUsers = dailyStats.reduce((sum: number, day: any) => sum + day.activeUsers, 0);
      const totalPageViews = dailyStats.reduce((sum: number, day: any) => sum + day.pageViews, 0);

      res.status(200).json({
        dailyStats,
        summary: {
          totalUsers,
          totalPageViews,
          averageUsersPerDay: Math.round(totalUsers / days),
        },
      });
    } catch (error) {
      console.error('Error fetching daily visitors:', error);
      res.status(500).json({
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * 페이지별 방문 통계 조회
 * GET /getPageStats?days=7&limit=10
 */
export const getPageStats = functions
  .region('asia-northeast3')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      const days = parseInt(req.query.days as string) || 7;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!GA4_PROPERTY_ID) {
        res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
        return;
      }

      const analyticsData = await getAnalyticsClient();

      const response: any = await analyticsData.properties.runReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        requestBody: {
          dateRanges: [{ startDate: `${days}daysAgo`, endDate: 'today' }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' },
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        },
      } as any);

      const allPageStats = response.data.rows?.map((row: any) => ({
        path: row.dimensionValues?.[0].value || '',
        title: row.dimensionValues?.[1].value || '',
        pageViews: parseInt(row.metricValues?.[0].value || '0'),
        activeUsers: parseInt(row.metricValues?.[1].value || '0'),
      })) || [];

      // 클라이언트 측에서 limit 적용
      const pageStats = allPageStats.slice(0, limit);

      res.status(200).json({ pageStats });
    } catch (error) {
      console.error('Error fetching page stats:', error);
      res.status(500).json({
        error: 'Failed to fetch page statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

/**
 * 실시간 활성 사용자 조회
 * GET /getRealtimeUsers
 */
export const getRealtimeUsers = functions
  .region('asia-northeast3')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    try {
      if (!GA4_PROPERTY_ID) {
        res.status(500).json({ error: 'GA4_PROPERTY_ID is not configured' });
        return;
      }

      const analyticsData = await getAnalyticsClient();

      const response: any = await analyticsData.properties.runRealtimeReport({
        property: `properties/${GA4_PROPERTY_ID}`,
        requestBody: {
          metrics: [{ name: 'activeUsers' }],
        },
      });

      const activeUsers = parseInt(
        response.data.rows?.[0]?.metricValues?.[0]?.value || '0'
      );

      res.status(200).json({ activeUsers });
    } catch (error) {
      console.error('Error fetching realtime users:', error);
      res.status(500).json({
        error: 'Failed to fetch realtime data',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
