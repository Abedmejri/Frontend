import { useState, useEffect } from "react";
import { Link } from 'react-router-dom';
import axiosClient from "./services/axios-client";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Spin,
  Alert,
  Space,
  message,
  Tooltip,
  Button,
  Badge,
  Avatar,
  Progress,
  Divider,
  Empty,
  Skeleton
} from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  EyeOutlined,
  RiseOutlined,
  FallOutlined,
  DashboardOutlined,
  ReloadOutlined
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Constants ---
const RECENT_ITEMS_COUNT = 5;

export default function Dashboard() {
  // State for data
  const [stats, setStats] = useState({ commissions: 0, meetings: 0, pvs: 0, users: 0 });
  const [recentCommissions, setRecentCommissions] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [recentPVs, setRecentPVs] = useState([]);
  
  // Add growth indicators for a more dynamic dashboard
  const [growth, setGrowth] = useState({
    commissions: { value: 0, isPositive: true },
    meetings: { value: 0, isPositive: true },
    pvs: { value: 0, isPositive: true },
    users: { value: 0, isPositive: true }
  });

  // State for loading and errors
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTables, setLoadingTables] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching ---
  const fetchData = async () => {
    setLoadingStats(true);
    setLoadingTables(true);
    setError(null);
    setRefreshing(true);

    try {
      // Fetch all data concurrently
      const [commissionsRes, meetingsRes, pvsRes, usersRes] = await Promise.all([
        axiosClient.get("/commissions?per_page=5&sort=-created_at"),
        axiosClient.get("/meetings?per_page=5&sort=-created_at"),
        axiosClient.get("/pvs?per_page=5&sort=-created_at"),
        axiosClient.get("/users?per_page=1"),
      ]);

      // --- Process Responses ---
      const getData = (response) => response?.data?.data || response?.data || [];
      const getTotalCount = (response) => response?.data?.meta?.total ?? (response?.data?.data || response?.data)?.length ?? 0;

      // Update Stats
      setStats({
        commissions: getTotalCount(commissionsRes),
        meetings: getTotalCount(meetingsRes),
        pvs: getTotalCount(pvsRes),
        users: getTotalCount(usersRes),
      });
      
      // Simulate growth data (in a real app, you'd fetch this from an endpoint)
      setGrowth({
        commissions: { value: 12.5, isPositive: true },
        meetings: { value: 8.3, isPositive: true },
        pvs: { value: 5.2, isPositive: false },
        users: { value: 3.7, isPositive: true }
      });
      
      setLoadingStats(false);

      // Update Recent Items Tables
      setRecentCommissions(getData(commissionsRes));
      setRecentMeetings(getData(meetingsRes));
      setRecentPVs(getData(pvsRes));
      setLoadingTables(false);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError("Failed to load dashboard data. Please try again later.");
      message.error("Failed to load dashboard data.");
      setLoadingStats(false);
      setLoadingTables(false);
    } finally {
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // --- Table Column Definitions ---
  const commissionColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Badge status={record.status === 'active' ? 'success' : 'default'} />
          <Link to={`/commissions/${record.id}`}>{text}</Link>
        </Space>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>,
      responsive: ['md'],
      width: 120,
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Link to={`/commissions/${record.id}`}>
            <Button type="primary" shape="circle" icon={<EyeOutlined />} size="small" />
          </Link>
        </Tooltip>
      ),
      width: 80,
      align: 'center',
    }
  ];

  const meetingColumns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Space>
          <Badge status={new Date(record.date) > new Date() ? 'processing' : 'success'} />
          <Link to={`/meetings/${record.id}`}>{text}</Link>
        </Space>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date) => new Date(date).toLocaleString(),
      responsive: ['md'],
      width: 180,
      align: 'center',
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      ellipsis: true,
      render: (text) => <Tooltip title={text}>{text}</Tooltip>
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Link to={`/meetings/${record.id}`}>
            <Button type="primary" shape="circle" icon={<EyeOutlined />} size="small" />
          </Link>
        </Tooltip>
      ),
      width: 80,
      align: 'center',
    }
  ];

  const pvColumns = [
    {
      title: "Meeting",
      dataIndex: ["meeting", "title"],
      key: "meeting_title",
      render: (text, record) => record.meeting_id ? 
        <Link to={`/meetings/${record.meeting_id}`}>{text || `Meeting ID: ${record.meeting_id}`}</Link> : 'N/A',
    },
    {
      title: "Content Snippet",
      dataIndex: "content",
      key: "content",
      ellipsis: true,
      render: (text) => <Tooltip title={text}><div style={{ whiteSpace: 'nowrap' }}>{text}</div></Tooltip>
    },
    {
      title: "Created",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>,
      responsive: ['md'],
      width: 120,
      align: 'center',
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Tooltip title="View Details">
          <Link to={`/pvs/${record.id}`}>
            <Button type="primary" shape="circle" icon={<EyeOutlined />} size="small" />
          </Link>
        </Tooltip>
      ),
      width: 80,
      align: 'center',
    }
  ];

  // Empty state component
  const EmptyState = ({ loading, type }) => (
    loading ? <Skeleton active paragraph={{ rows: 3 }} /> : 
    <Empty description={`No recent ${type}`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
  );

  // --- Render Logic ---
  if (error) {
    return (
      <Alert
        message="Dashboard Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" type="primary" onClick={fetchData}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div className="dashboard-container" style={{ padding: '16px' }}>
      <Spin spinning={loadingStats && loadingTables && !refreshing} tip="Loading Dashboard...">
        <Space direction="vertical" size="large" style={{ display: 'flex' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <DashboardOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
              <Title level={2} style={{ margin: 0 }}>Dashboard</Title>
            </Space>
            <Button 
              onClick={fetchData} 
              icon={<ReloadOutlined spin={refreshing} />} 
              loading={refreshing}
            >
              Refresh
            </Button>
          </div>
          
          <Divider style={{ margin: '16px 0' }} />

          {/* --- Statistics Row --- */}
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                bordered={false} 
                style={{ 
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)', 
                  borderRadius: '12px',
                  height: '100%'
                }}
              >
                <Statistic
                  title={<Text strong>Total Commissions</Text>}
                  value={stats.commissions}
                  loading={loadingStats}
                  prefix={<Avatar shape="square" icon={<TeamOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold', fontSize: '28px' }}
                  suffix={
                    <Text type={growth.commissions.isPositive ? "success" : "danger"} style={{ fontSize: '14px' }}>
                      {growth.commissions.isPositive ? <RiseOutlined /> : <FallOutlined />}
                      {growth.commissions.value}%
                    </Text>
                  }
                />
                <div style={{ marginTop: '16px' }}>
                  <Progress 
                    percent={50} 
                    showInfo={false} 
                    strokeColor="#1890ff" 
                    trailColor="#e6f7ff"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                bordered={false} 
                style={{ 
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)', 
                  borderRadius: '12px',
                  height: '100%'
                }}
              >
                <Statistic
                  title={<Text strong>Total Meetings</Text>}
                  value={stats.meetings}
                  loading={loadingStats}
                  prefix={<Avatar shape="square" icon={<CalendarOutlined />} style={{ backgroundColor: '#faad14' }} />}
                  valueStyle={{ color: '#faad14', fontWeight: 'bold', fontSize: '28px' }}
                  suffix={
                    <Text type={growth.meetings.isPositive ? "success" : "danger"} style={{ fontSize: '14px' }}>
                      {growth.meetings.isPositive ? <RiseOutlined /> : <FallOutlined />}
                      {growth.meetings.value}%
                    </Text>
                  }
                />
                <div style={{ marginTop: '16px' }}>
                  <Progress 
                    percent={65} 
                    showInfo={false} 
                    strokeColor="#faad14" 
                    trailColor="#fff7e6"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                bordered={false} 
                style={{ 
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)', 
                  borderRadius: '12px',
                  height: '100%'
                }}
              >
                <Statistic
                  title={<Text strong>Total PVs</Text>}
                  value={stats.pvs}
                  loading={loadingStats}
                  prefix={<Avatar shape="square" icon={<FileTextOutlined />} style={{ backgroundColor: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a', fontWeight: 'bold', fontSize: '28px' }}
                  suffix={
                    <Text type={growth.pvs.isPositive ? "success" : "danger"} style={{ fontSize: '14px' }}>
                      {growth.pvs.isPositive ? <RiseOutlined /> : <FallOutlined />}
                      {growth.pvs.value}%
                    </Text>
                  }
                />
                <div style={{ marginTop: '16px' }}>
                  <Progress 
                    percent={40} 
                    showInfo={false} 
                    strokeColor="#52c41a" 
                    trailColor="#f6ffed"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card 
                hoverable
                bordered={false} 
                style={{ 
                  boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08), 0 9px 28px 0 rgba(0,0,0,0.05), 0 12px 48px 16px rgba(0,0,0,0.03)', 
                  borderRadius: '12px',
                  height: '100%'
                }}
              >
                <Statistic
                  title={<Text strong>Total Users</Text>}
                  value={stats.users}
                  loading={loadingStats}
                  prefix={<Avatar shape="square" icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold', fontSize: '28px' }}
                  suffix={
                    <Text type={growth.users.isPositive ? "success" : "danger"} style={{ fontSize: '14px' }}>
                      {growth.users.isPositive ? <RiseOutlined /> : <FallOutlined />}
                      {growth.users.value}%
                    </Text>
                  }
                />
                <div style={{ marginTop: '16px' }}>
                  <Progress 
                    percent={75} 
                    showInfo={false} 
                    strokeColor="#722ed1" 
                    trailColor="#f9f0ff"
                    size="small"
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* --- Recent Items Row --- */}
          <Row gutter={[24, 24]}>
            {/* Recent Commissions */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff', marginRight: '8px' }} icon={<TeamOutlined />} />
                    <Text strong>Recent Commissions</Text>
                  </div>
                }
                bordered={false}
                style={{ boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08)', borderRadius: '12px' }}
                extra={<Link to="/commissions"><Button type="link">View All</Button></Link>}
              >
                {recentCommissions.length > 0 ? (
                  <Table
                    columns={commissionColumns}
                    dataSource={recentCommissions}
                    rowKey="id"
                    pagination={false}
                    loading={loadingTables}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                  />
                ) : (
                  <EmptyState loading={loadingTables} type="commissions" />
                )}
              </Card>
            </Col>

            {/* Recent Meetings */}
            <Col xs={24} lg={12}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar size="small" style={{ backgroundColor: '#faad14', marginRight: '8px' }} icon={<CalendarOutlined />} />
                    <Text strong>Recent Meetings</Text>
                  </div>
                }
                bordered={false}
                style={{ boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08)', borderRadius: '12px' }}
                extra={<Link to="/meetings"><Button type="link">View All</Button></Link>}
              >
                {recentMeetings.length > 0 ? (
                  <Table
                    columns={meetingColumns}
                    dataSource={recentMeetings}
                    rowKey="id"
                    pagination={false}
                    loading={loadingTables}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                  />
                ) : (
                  <EmptyState loading={loadingTables} type="meetings" />
                )}
              </Card>
            </Col>
          </Row>

          {/* --- Recent PVs Row --- */}
          <Row>
            <Col span={24}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar size="small" style={{ backgroundColor: '#52c41a', marginRight: '8px' }} icon={<FileTextOutlined />} />
                    <Text strong>Recent PVs</Text>
                  </div>
                }
                bordered={false}
                style={{ boxShadow: '0 6px 16px -8px rgba(0,0,0,0.08)', borderRadius: '12px' }}
                extra={<Link to="/pvs"><Button type="link">View All</Button></Link>}
              >
                {recentPVs.length > 0 ? (
                  <Table
                    columns={pvColumns}
                    dataSource={recentPVs}
                    rowKey="id"
                    pagination={false}
                    loading={loadingTables}
                    size="middle"
                    scroll={{ x: 'max-content' }}
                  />
                ) : (
                  <EmptyState loading={loadingTables} type="PVs" />
                )}
              </Card>
            </Col>
          </Row>

        </Space>
      </Spin>
    </div>
  );
}