import React, { useState, useEffect, useMemo } from 'react';
import {
  Layout,
  Menu,
  List,
  Card,
  Spin,
  Alert,
  Typography,
  Input,
  Row,
  Col,
  Empty,
  Tag,
  Space,
  Divider,
  Button,
  Avatar // For a nicer touch with user
} from 'antd';
import { UserOutlined, AppstoreOutlined, UnorderedListOutlined, CalendarOutlined, EnvironmentOutlined, EnvironmentFilled } from '@ant-design/icons';
import { getCurrentUser, getCommissions, getMeetingsForCommission } from '../../services/userServices'; // Adjust path

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    // hour: '2-digit',
    // minute: '2-digit',
  });
};

function UserCommissions() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUserCommissions, setAllUserCommissions] = useState([]); // Store all fetched commissions for the user
  const [selectedCommissionId, setSelectedCommissionId] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(false);
  const [error, setError] = useState('');
  const [commissionSearchTerm, setCommissionSearchTerm] = useState('');
  const [meetingSearchTerm, setMeetingSearchTerm] = useState('');

  // 1. Fetch current user on component mount
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await getCurrentUser();
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Failed to fetch current user:", err);
        setError("Could not load your user data. Please try again later.");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // 2. Fetch all commissions and filter them once current user is available
  useEffect(() => {
    if (!currentUser) return;

    const fetchAndFilterCommissions = async () => {
      setLoadingCommissions(true);
      setError('');
      try {
        const response = await getCommissions(); // Fetches ALL commissions
        const allCommissionsData = response.data;

        const filtered = allCommissionsData.filter(commission =>
          commission.members && commission.members.some(member => member.id === currentUser.id)
        );
        setAllUserCommissions(filtered);
      } catch (err) {
        console.error("Failed to fetch commissions:", err);
        setError("Could not load commissions.");
      } finally {
        setLoadingCommissions(false);
      }
    };

    fetchAndFilterCommissions();
  }, [currentUser]);

  // Memoized filtered commissions based on search term
  const filteredUserCommissions = useMemo(() => {
    if (!commissionSearchTerm) return allUserCommissions;
    return allUserCommissions.filter(commission =>
      commission.name.toLowerCase().includes(commissionSearchTerm.toLowerCase())
    );
  }, [allUserCommissions, commissionSearchTerm]);

  // Memoized filtered meetings based on search term
  const filteredMeetings = useMemo(() => {
    if (!meetingSearchTerm) return meetings;
    return meetings.filter(meeting =>
      meeting.title.toLowerCase().includes(meetingSearchTerm.toLowerCase()) ||
      meeting.location.toLowerCase().includes(meetingSearchTerm.toLowerCase())
    );
  }, [meetings, meetingSearchTerm]);


  // 3. Fetch meetings when a commission is selected
  useEffect(() => {
    if (!selectedCommissionId) {
      setMeetings([]);
      return;
    }

    const fetchMeetings = async () => {
      setLoadingMeetings(true);
      setError('');
      try {
        const response = await getMeetingsForCommission(selectedCommissionId);
        setMeetings(response.data);
      } catch (err) {
        console.error(`Failed to fetch meetings for commission ${selectedCommissionId}:`, err);
        setError(`Could not load meetings. Please try again.`);
      } finally {
        setLoadingMeetings(false);
      }
    };

    fetchMeetings();
  }, [selectedCommissionId]);

  const handleSelectCommission = (commissionId) => {
    setSelectedCommissionId(commissionId);
  };

  const selectedCommissionDetails = useMemo(() => {
    return allUserCommissions.find(c => c.id === selectedCommissionId);
  }, [allUserCommissions, selectedCommissionId]);


  if (loadingUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading your profile..." />
      </div>
    );
  }

  if (error && !currentUser) { // Critical error if user data couldn't load
    return <Alert message="Error" description={error} type="error" showIcon closable />;
  }

  return (
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' /* Adjust if you have a global header */ }}>
      <Sider
        width={350}
        style={{ background: '#fff', padding: '16px', borderRight: '1px solid #f0f0f0', overflowY: 'auto' }}
        breakpoint="lg"
        collapsedWidth="0" // Hides sider on smaller screens
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {currentUser && (
            <Card bordered={false} style={{ marginBottom: 16, background: '#fafafa' }}>
              <Avatar size={64} icon={<UserOutlined />} style={{ marginRight: 16, float: 'left' }} />
              <Title level={4} style={{ marginBottom: 0 }}>{currentUser.name || 'User'}</Title>
              <Text type="secondary">{currentUser.email}</Text>
            </Card>
          )}
          <Title level={4} style={{ marginTop: 0 }}>Your Commissions</Title>
          <Search
            placeholder="Search commissions..."
            onChange={e => setCommissionSearchTerm(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
        </Space>

        {loadingCommissions ? (
          <div style={{ textAlign: 'center', marginTop: 20 }}><Spin /></div>
        ) : error && !allUserCommissions.length ? ( // Show error only if commissions failed to load and list is empty
          <Alert message="Error" description={error} type="error" showIcon />
        ) : filteredUserCommissions.length > 0 ? (
          <Menu
            mode="inline"
            selectedKeys={selectedCommissionId ? [selectedCommissionId.toString()] : []}
            onClick={({ key }) => handleSelectCommission(parseInt(key))}
            style={{ borderRight: 0 }}
          >
            {filteredUserCommissions.map(commission => (
              <Menu.Item key={commission.id.toString()} icon={<AppstoreOutlined />}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: selectedCommissionId === commission.id ? 'bold' : 'normal' }}>
                    {commission.name}
                  </span>
                  <Space size="small">
                    <Tag color="blue">{commission.meetings_count || 0} Meetings</Tag>
                    <Tag color="green">{commission.members_count || 0} Members</Tag>
                  </Space>
                </div>
              </Menu.Item>
            ))}
          </Menu>
        ) : (
          <Empty description={commissionSearchTerm ? "No commissions match your search." : "You are not a member of any commissions."} />
        )}
      </Sider>
      <Layout style={{ padding: '0 24px 24px', background: '#f0f2f5' }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)'
          }}
        >
          {selectedCommissionDetails ? (
            <>
              <Title level={3}>{selectedCommissionDetails.name}</Title>
              {selectedCommissionDetails.description && (
                <Paragraph type="secondary" ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
                  {selectedCommissionDetails.description}
                </Paragraph>
              )}
              <Divider />
              <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                <Col>
                  <Title level={4} style={{ margin: 0 }}>Meetings</Title>
                </Col>
                <Col>
                  <Search
                    placeholder="Search meetings by title or location..."
                    onChange={e => setMeetingSearchTerm(e.target.value)}
                    style={{ width: 300 }}
                    allowClear
                    disabled={meetings.length === 0 && !meetingSearchTerm}
                  />
                </Col>
              </Row>

              {loadingMeetings ? (
                <div style={{ textAlign: 'center', marginTop: 50 }}><Spin tip="Loading meetings..." /></div>
              ) : error && !meetings.length ? ( // Show error for meetings if they failed and list is empty
                 <Alert message="Error" description={error} type="error" showIcon />
              ) : filteredMeetings.length > 0 ? (
                <List
                  itemLayout="vertical"
                  size="large"
                  dataSource={filteredMeetings}
                  renderItem={meeting => (
                    <List.Item
                      key={meeting.id}
                      actions={meeting.gps ? [
                        <Button
                          type="link"
                          icon={<EnvironmentFilled />}
                          href={`https://www.google.com/maps?q=${meeting.gps}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View on Map
                        </Button>
                      ] : []}
                    >
                      <List.Item.Meta
                        title={<Text strong style={{fontSize: '1.1em'}}>{meeting.title}</Text>}
                        description={
                          <Space direction="vertical" size="small">
                            <Text><CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} /> Date: {formatDate(meeting.date)}</Text>
                            <Text><EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} /> Location: {meeting.location}</Text>
                            {/* {meeting.gps && <Text><AimOutlined style={{marginRight: 8, color: '#faad14'}} /> GPS: {meeting.gps}</Text>} */}
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description={meetingSearchTerm ? "No meetings match your search." : "No meetings found for this commission."} />
              )}
            </>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  Select a commission from the left panel to view its details and meetings.
                </Text>
              }
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default UserCommissions;