import React, { useState, useEffect } from 'react';
import {
  Layout,
  Calendar,
  Badge,
  List,
  Typography,
  Spin,
  Alert,
  Row,
  Col,
  Card,
  Tag,
  Empty,
  Tooltip,
  Button, // Added
  message,  // Added
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  VideoCameraAddOutlined, // Added
  LockOutlined,           // Added
} from '@ant-design/icons';
import moment from 'moment';
import {
  format,
  isSameDay,
  isFuture,
  isPast,
  differenceInMilliseconds,
  formatDuration,
  intervalToDuration,
} from 'date-fns';
import { getCurrentUser, getCommissions, getMeetings } from '../../services/userServices';

// Import VideoChatModal and echo (adjust paths as necessary)
import VideoChatModal from '../Meetings/VideoChatModal.jsx'; // Assuming path from src/components/User_Schedule.jsx to src/components/Meetings/VideoChatModal.jsx
import echo from '../../services/echo.js'; // Assuming path from src/components/User_Schedule.jsx to src/services/echo.js

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const formatTimeLeft = (ms) => {
  if (ms <= 0) return 'Meeting has started or passed';
  const duration = intervalToDuration({ start: 0, end: ms });
  return formatDuration(duration, {
    format: ['years', 'months', 'days', 'hours', 'minutes', 'seconds'],
    delimiter: ', ',
  });
};

function User_Schedule() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUserMeetings, setAllUserMeetings] = useState([]);
  const [upcomingMeetingsWithTime, setUpcomingMeetingsWithTime] = useState([]);
  const [allCommissionsData, setAllCommissionsData] = useState([]); // To store full commission data

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');

  // State for Video Modal
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [currentMeetingForVideo, setCurrentMeetingForVideo] = useState(null);

  // 1. Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      try {
        const response = await getCurrentUser();
        setCurrentUser(response.data);
      } catch (err) {
        console.error("User_Schedule: Failed to fetch current user:", err);
        setError("Could not load your user data.");
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  // 2. Fetch commissions and then all meetings once user is available
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      setLoadingData(true);
      setError('');
      try {
        const commissionsResponse = await getCommissions();
        const fetchedCommissions = commissionsResponse.data || [];
        setAllCommissionsData(fetchedCommissions); // Store all commission data

        const currentUserCommissionIds = fetchedCommissions
          .filter(commission => commission.members && commission.members.some(member => member.id === currentUser.id))
          .map(commission => commission.id);

        if (currentUserCommissionIds.length > 0) {
          const meetingsResponse = await getMeetings();
          const allMeetingsData = meetingsResponse.data || [];
          const filteredMeetings = allMeetingsData.filter(meeting =>
            currentUserCommissionIds.includes(meeting.commission_id)
          ).map(meeting => ({
            ...meeting,
            dateObj: new Date(meeting.date) // Ensure dateObj is a Date object
          }));
          setAllUserMeetings(filteredMeetings);
        } else {
          setAllUserMeetings([]);
        }
      } catch (err) {
        console.error("User_Schedule: Failed to fetch schedule data:", err);
        setError("Could not load your schedule. Please try again.");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [currentUser]);

  // 3. Calculate and update time left for upcoming meetings
  useEffect(() => {
    if (allUserMeetings.length === 0) {
      setUpcomingMeetingsWithTime([]);
      return;
    }
    const updateTimes = () => {
      const now = new Date();
      const upcoming = allUserMeetings
        .filter(meeting => isFuture(meeting.dateObj))
        .map(meeting => {
          const timeLeftMs = differenceInMilliseconds(meeting.dateObj, now);
          return {
            ...meeting,
            timeLeft: formatTimeLeft(timeLeftMs),
            timeLeftMs: timeLeftMs
          };
        })
        .sort((a, b) => a.timeLeftMs - b.timeLeftMs);
      setUpcomingMeetingsWithTime(upcoming);
    };
    updateTimes();
    const intervalId = setInterval(updateTimes, 1000);
    return () => clearInterval(intervalId);
  }, [allUserMeetings]);

  // --- Video Chat Handlers ---
  const handleJoinVideoCall = (meeting) => {
    if (!echo || !currentUser?.id || !meeting?.id || !meeting.commission_id) {
        message.error("Cannot initialize video call. Missing required data.");
        console.error("Video call init error: Missing data", { echoConfig: !!echo, userId: currentUser?.id, meetingId: meeting?.id, commissionId: meeting?.commission_id });
        return;
    }

    const commission = allCommissionsData.find(c => c.id === meeting.commission_id);
    if (!commission) {
        message.error("Commission details for this meeting could not be found.");
        console.error("Video call init error: Commission not found for meeting", { meetingCommId: meeting.commission_id, availableCommissions: allCommissionsData.length });
        return;
    }

    if (!commission.members?.some(m => m?.id === currentUser.id)) {
        message.warning({
            content: "Access Denied: You are not a member of this meeting's commission.",
            icon: <LockOutlined />,
            duration: 4
        });
        return;
    }
    setCurrentMeetingForVideo(meeting);
    setIsVideoModalVisible(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalVisible(false);
    setCurrentMeetingForVideo(null);
  };

  // Function to render meetings in calendar cells
  const dateCellRender = (currentMomentDate) => {
    const cellDate = currentMomentDate.toDate();
    const listData = allUserMeetings.filter(meeting => isSameDay(meeting.dateObj, cellDate));

    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {listData.map(item => (
          <li key={item.id}>
            <Tooltip title={`${item.title} @ ${format(item.dateObj, 'p')} - ${item.location}`}>
              <Badge
                status={isPast(item.dateObj) ? 'default' : 'success'}
                text={item.title}
              />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const handleCalendarSelect = (dateMoment) => {
    console.log(`User_Schedule: Calendar date SELECTED by user: ${dateMoment.format("YYYY-MM-DD")}`);
  };

  const handleCalendarPanelChange = (dateMoment, mode) => {
    console.log(`User_Schedule: Calendar panel CHANGED by user to: ${dateMoment.format("YYYY-MM")}, mode: ${mode}`);
  };

  if (loadingUser) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Spin size="large" tip="Loading user..." /></div>;
  }

  if (error && !currentUser) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <Layout style={{ padding: '24px', background: '#f0f2f5' }}>
      <Content style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Title level={2} style={{ marginBottom: 24 }}>Your Schedule</Title>
        {error && !loadingData && <Alert message="Error" description={error} type="error" showIcon closable style={{ marginBottom: 16 }} />}

        {loadingData && (!allUserMeetings || allUserMeetings.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}><Spin size="large" tip="Loading schedule..." /></div>
        ) : (
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <Card title="Meetings Calendar">
                <Calendar
                  dateCellRender={dateCellRender}
                  onSelect={handleCalendarSelect}
                  onPanelChange={handleCalendarPanelChange}
                />
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Upcoming Meetings">
                {loadingData && upcomingMeetingsWithTime.length === 0 ? (
                   <div style={{ textAlign: 'center', padding: '20px 0' }}><Spin tip="Loading meetings..." /></div>
                ) : upcomingMeetingsWithTime.length > 0 ? (
                  <List
                    itemLayout="horizontal"
                    dataSource={upcomingMeetingsWithTime}
                    renderItem={item => (
                      <List.Item
                        actions={[
                            // Only show button if meeting is not too old (e.g., started less than a few hours ago)
                            // For simplicity, we enable it for all upcoming, and the video call handler/service will manage actual joinability
                            <Tooltip title="Join Video Call" key={`join-video-${item.id}`}>
                                <Button
                                    shape="circle"
                                    icon={<VideoCameraAddOutlined />}
                                    onClick={() => handleJoinVideoCall(item)}
                                    disabled={!echo || !currentUser} // Basic check, more in handler
                                />
                            </Tooltip>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text strong>{item.title}</Text>}
                          description={
                            <>
                              <Paragraph style={{ marginBottom: 4 }}>
                                <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                {format(item.dateObj, 'PPPp')}
                              </Paragraph>
                              <Paragraph style={{ marginBottom: 4 }}>
                                <EnvironmentOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                {item.location}
                              </Paragraph>
                              <Tag icon={<ClockCircleOutlined />} color={item.timeLeftMs <= 0 ? "default" : "processing"}>
                                {item.timeLeft}
                              </Tag>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description={loadingData ? "Loading..." : "No upcoming meetings found."} />
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Content>

      {/* Video Chat Modal */}
      {currentMeetingForVideo && currentUser && echo && (
        <VideoChatModal
            visible={isVideoModalVisible}
            onClose={closeVideoModal}
            meeting={currentMeetingForVideo}
            echo={echo}
            currentUser={currentUser}
        />
      )}
    </Layout>
  );
}

export default User_Schedule;