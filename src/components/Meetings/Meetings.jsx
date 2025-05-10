import React, { useState, useEffect, useCallback } from "react";
import {
    Table, Button, Modal, Form, Input, Typography, Space, message, DatePicker, Select, Tooltip, Row, Col, Divider, Card, Tag,
    Skeleton, Alert
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserAddOutlined, VideoCameraAddOutlined, FilterOutlined,
    CalendarOutlined, EnvironmentOutlined, ClockCircleOutlined, TeamOutlined, LockOutlined, ReloadOutlined,
    AppstoreAddOutlined
} from "@ant-design/icons";
import moment from "moment";
import VideoChatModal from "../Meetings/VideoChatModal.jsx"; // FIXME: Adjust path if needed
import echo from '../../services/echo.js'; // FIXME: Adjust path if needed
import { useStateContext } from "../../context/ContextProvider.jsx"; // FIXME: Adjust path if needed
import axiosClient from "../../services/axios-client.js"; // FIXME: Adjust path if needed

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function MeetingsManager() {
    // --- State ---
    const { user: currentUser } = useStateContext();

    // Data
    const [meetings, setMeetings] = useState([]);
    const [filteredMeetings, setFilteredMeetings] = useState([]);
    const [commissions, setCommissions] = useState([]);
    const [users, setUsers] = useState([]);

    // Loading & UI Control
    const [loading, setLoading] = useState(true);
    const [isFetchingInitialData, setIsFetchingInitialData] = useState(true);
    const [modalLoading, setModalLoading] = useState(false);
    const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false);
    const [isCommissionModalVisible, setIsCommissionModalVisible] = useState(false);
    const [isUserModalVisible, setIsUserModalVisible] = useState(false);
    const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);

    // Editing/Selection State
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [selectedCommission, setSelectedCommission] = useState(null);
    const [currentMeetingForVideo, setCurrentMeetingForVideo] = useState(null);

    // Filter States
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterCommissionId, setFilterCommissionId] = useState(null);
    const [filterDateRange, setFilterDateRange] = useState(null);

    // Forms
    const [meetingForm] = Form.useForm();
    const [commissionForm] = Form.useForm();
    const [userForm] = Form.useForm();

    // --- Data Fetching ---
    const fetchData = useCallback(async (showLoadingSpinner = true) => {
        if (showLoadingSpinner) setLoading(true);
        try {
            const [meetingsRes, commissionsRes, usersRes] = await Promise.all([
                axiosClient.get("/meetings"),
                axiosClient.get("/commissions"),
                axiosClient.get("/users")
            ]);
            setMeetings(meetingsRes.data || []);
            setCommissions(commissionsRes.data || []);
            setUsers(usersRes.data?.data || usersRes.data || []);
            if (!showLoadingSpinner) message.success("Data refreshed!", 2);
        } catch (error) {
            console.error("Fetch Data Error:", error);
            message.error("Failed to fetch data. Please try again.");
        } finally {
            if (showLoadingSpinner) setLoading(false);
            setIsFetchingInitialData(false);
        }
    }, []);

    useEffect(() => {
        if (currentUser) {
            setIsFetchingInitialData(true);
            fetchData(true);
        }
    }, [currentUser, fetchData]);

    // --- Filtering Logic ---
    const applyFilters = useCallback(() => {
        if (isFetchingInitialData) return;

        let filtered = [...meetings];
        const keyword = searchKeyword.toLowerCase().trim();

        if (keyword) {
            filtered = filtered.filter((meeting) => {
                const commission = commissions.find((c) => c.id === meeting.commission_id);
                const commissionName = commission ? commission.name.toLowerCase() : "";
                return (
                    (meeting.title && meeting.title.toLowerCase().includes(keyword)) ||
                    (meeting.location && meeting.location.toLowerCase().includes(keyword)) ||
                    commissionName.includes(keyword)
                );
            });
        }
        if (filterCommissionId) {
            filtered = filtered.filter(m => m.commission_id === filterCommissionId);
        }
        if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
            const localStartDate = moment(filterDateRange[0]).startOf('day');
            const localEndDate = moment(filterDateRange[1]).endOf('day');
            const utcStartDate = localStartDate.utc();
            const utcEndDate = localEndDate.utc();
            filtered = filtered.filter(meeting => {
                if (!meeting.date) return false;
                const meetingDateUTC = moment.utc(meeting.date);
                return meetingDateUTC.isValid() && meetingDateUTC.isBetween(utcStartDate, utcEndDate, null, '[]');
            });
        }
        setFilteredMeetings(filtered);
    }, [meetings, searchKeyword, filterCommissionId, filterDateRange, commissions, isFetchingInitialData]);

    useEffect(() => {
        applyFilters();
    }, [applyFilters]);

    // --- Filter Change Handlers ---
    const handleSearchChange = (e) => setSearchKeyword(e.target.value);
    const handleCommissionFilterChange = (value) => setFilterCommissionId(value);
    const handleDateFilterChange = (dates) => setFilterDateRange(dates);
    const clearFilters = () => {
        setSearchKeyword("");
        setFilterCommissionId(null);
        setFilterDateRange(null);
        message.info("Filters cleared.");
    };

    // --- Modal Control ---
    const showMeetingModal = useCallback((meeting = null) => {
        setEditingMeeting(meeting);
        if (meeting) {
            console.log("FRONTEND (showMeetingModal): 1. Data received for editing (raw UTC string from API):", meeting.date);
            const localDateForPicker = meeting.date ? moment.utc(meeting.date).local() : null;
            meetingForm.setFieldsValue({
                ...meeting,
                date: localDateForPicker, // DatePicker expects a moment object in local time
            });
            if(localDateForPicker && localDateForPicker.isValid()) {
                console.log("FRONTEND (showMeetingModal): 2. Date set in form (local for picker):", localDateForPicker.format("YYYY-MM-DD HH:mm:ss Z"));
            } else if (meeting.date) {
                console.error("FRONTEND (showMeetingModal): 2a. Failed to parse API date into local moment for picker. API date:", meeting.date);
            }
             else {
                console.log("FRONTEND (showMeetingModal): 2. Date from API was null/empty, picker set to null.");
            }
        } else {
            meetingForm.resetFields();
            console.log("FRONTEND (showMeetingModal): New meeting, form reset.");
        }
        setIsMeetingModalVisible(true);
    }, [meetingForm]);

    const showCommissionModal = () => {
        commissionForm.resetFields();
        setIsCommissionModalVisible(true);
    };

    const showUserManagementModal = useCallback((commissionId) => {
        const commission = commissions.find(c => c.id === commissionId);
        if (!commission) { message.error("Commission not found."); return; }
        setSelectedCommission(commission);
        userForm.setFieldsValue({ members: commission.members?.map(u => u.id) || [] });
        setIsUserModalVisible(true);
    }, [commissions, userForm]);

    const closeModal = (modalType) => {
        switch (modalType) {
            case 'meeting': setIsMeetingModalVisible(false); setEditingMeeting(null); break;
            case 'commission': setIsCommissionModalVisible(false); break;
            case 'user': setIsUserModalVisible(false); setSelectedCommission(null); break;
            case 'video': setIsVideoModalVisible(false); setCurrentMeetingForVideo(null); break;
            default: break;
        }
    };

    // --- Form Submission Handlers ---
    const handleMeetingFormSubmit = async (values) => {
        setModalLoading(true);

        const dateValueFromForm = values.date;

        // --- START LOGGING ---
        console.log("FRONTEND (handleMeetingFormSubmit): 1. values.date (from form values object):", dateValueFromForm);
        console.log("FRONTEND (handleMeetingFormSubmit): 1a. typeof values.date:", typeof dateValueFromForm);
        let localMomentForProcessing;

        if (moment.isMoment(dateValueFromForm)) {
            console.log("FRONTEND (handleMeetingFormSubmit): 1b. values.date IS a Moment object.");
            localMomentForProcessing = dateValueFromForm;
        } else if (dateValueFromForm) { // If it exists but isn't a moment object, try to parse it
            console.log("FRONTEND (handleMeetingFormSubmit): 1b. values.date is NOT a Moment object. Attempting to parse with moment(). Value:", dateValueFromForm);
            localMomentForProcessing = moment(dateValueFromForm); // Attempt to parse it (e.g., if it's a date string or native Date)
            if (!localMomentForProcessing.isValid()) {
                console.error("FRONTEND (handleMeetingFormSubmit): CRITICAL - Failed to parse dateValueFromForm into a valid moment object. Value was:", dateValueFromForm);
                message.error("Invalid date selected. Please check the format or re-select.");
                setModalLoading(false);
                return; // Stop submission
            }
            console.log("FRONTEND (handleMeetingFormSubmit): 1c. Parsed into moment object (local time):", localMomentForProcessing.format("YYYY-MM-DD HH:mm:ss Z"));
        } else {
            console.log("FRONTEND (handleMeetingFormSubmit): 1b. values.date is null or undefined (no date selected).");
            localMomentForProcessing = null; // No date was selected
        }

        if (localMomentForProcessing && localMomentForProcessing.isValid()) {
            console.log("FRONTEND (handleMeetingFormSubmit): 2. localMomentForProcessing (local with TZ):", localMomentForProcessing.format("YYYY-MM-DD HH:mm:ss Z"));
            console.log("FRONTEND (handleMeetingFormSubmit): 3. localMomentForProcessing as ISO string (local):", localMomentForProcessing.toISOString());
            console.log("FRONTEND (handleMeetingFormSubmit): 4. localMomentForProcessing cloned and converted to UTC ISO string:", localMomentForProcessing.clone().utc().toISOString());
        }
        // --- END LOGGING ---

        const formattedDateUTC = localMomentForProcessing && localMomentForProcessing.isValid()
            ? localMomentForProcessing.utc().format("YYYY-MM-DD HH:mm:ss") // Ensure it's formatted for backend
            : null;

        console.log("FRONTEND (handleMeetingFormSubmit): 5. Formatted date SENT TO BACKEND (UTC string 'YYYY-MM-DD HH:mm:ss'):", formattedDateUTC);

        // Additional check: if a date was supposed to be there but formatting failed, abort
        if (values.date && !formattedDateUTC && localMomentForProcessing && !localMomentForProcessing.isValid()) {
            console.error("FRONTEND (handleMeetingFormSubmit): CRITICAL - Original date existed but processing resulted in null/invalid formattedDateUTC. Aborting submission.");
            message.error("Error processing date. Please ensure the date is valid and try again.");
            setModalLoading(false);
            return;
        }

        const formattedValues = {
            title: values.title,
            date: formattedDateUTC,
            location: values.location,
            gps: values.gps ? values.gps.trim() : null,
            commission_id: values.commission_id,
        };

        const isEditing = !!editingMeeting;
        const endpoint = isEditing ? `/meetings/${editingMeeting.id}` : "/meetings";
        const method = isEditing ? "put" : "post";

        try {
            await axiosClient[method](endpoint, formattedValues);
            message.success(`Meeting ${isEditing ? 'updated' : 'created'} successfully!`);
            closeModal('meeting');
            fetchData(false);
        } catch (error) {
            console.error("Error submitting meeting. Request payload:", formattedValues, "Error:", error.response?.data || error.message);
            const errorMsg = error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} meeting.`;
            message.error(errorMsg);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                meetingForm.setFields(Object.entries(error.response.data.errors).map(([name, errors]) => ({ name, errors })));
            }
        } finally {
            setModalLoading(false);
        }
    };


    const handleCommissionFormSubmit = async (values) => {
        setModalLoading(true);
        try {
            const payload = { name: values.name, description: values.description, members: values.members || [] };
            const { data: newCommission } = await axiosClient.post("/commissions", payload);
            message.success("Commission created successfully!");
            await fetchData(false);
            if (isMeetingModalVisible && !editingMeeting) {
                meetingForm.setFieldsValue({ commission_id: newCommission.id });
            }
            closeModal('commission');
        } catch (error) {
            const errorMsg = error.response?.data?.message || "Failed to create commission.";
            message.error(errorMsg);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                commissionForm.setFields(Object.entries(error.response.data.errors).map(([name, errors]) => ({ name, errors })));
            }
        } finally {
            setModalLoading(false);
        }
    };

    const handleUserFormSubmit = async (values) => {
        if (!selectedCommission) return;
        setModalLoading(true);
        try {
            await axiosClient.post(`/commissions/${selectedCommission.id}/users/update`, { user_ids: values.members || [] });
            message.success(`Members for "${selectedCommission.name}" updated!`);
            closeModal('user');
            fetchData(false);
        } catch (error) {
            message.error(error?.response?.data?.message || "Failed to update members.");
             if (error.response?.status === 422 && error.response?.data?.errors) {
                userForm.setFields([{ name: 'members', errors: Object.values(error.response.data.errors).flat() }]);
            }
        } finally {
            setModalLoading(false);
        }
    };

    // --- Delete Handlers ---
    const confirmDelete = (type, item) => {
        Modal.confirm({
            title: `Delete ${type}?`,
            content: `Are you sure you want to permanently delete "${type === 'Meeting' ? item.title : item.name}"? This action cannot be undone.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                setLoading(true);
                try {
                    if (type === 'Meeting') {
                        await axiosClient.delete(`/meetings/${item.id}`);
                    } else if (type === 'Commission') {
                        await axiosClient.delete(`/commissions/${item.id}`);
                        if (isMeetingModalVisible && meetingForm.getFieldValue('commission_id') === item.id) {
                            meetingForm.setFieldsValue({ commission_id: undefined });
                        }
                    }
                    message.success(`${type} deleted successfully!`);
                    fetchData(true);
                } catch (error) {
                    message.error(error?.response?.data?.message || `Failed to delete ${type}.`);
                    setLoading(false);
                }
            },
        });
    };

    // --- Video Chat ---
    const handleJoinVideoCall = useCallback((meeting) => {
        if (!echo || !currentUser?.id || !meeting?.id || !meeting.commission_id) {
            message.error("Cannot initialize video call. Missing required data.");
            return;
        }
        const commission = commissions.find(c => c.id === meeting.commission_id);
        if (!commission || !commission.members?.some(m => m?.id === currentUser.id)) {
            message.warning({ content: "Access Denied: You are not a member of this meeting's commission.", icon: <LockOutlined />, duration: 4 });
            return;
        }
        setCurrentMeetingForVideo(meeting);
        setIsVideoModalVisible(true);
    }, [currentUser, commissions, echo]);

    // --- Page Reset ---
    const resetAllStates = useCallback(() => {
        clearFilters();
        setIsMeetingModalVisible(false);
        setIsCommissionModalVisible(false);
        setIsUserModalVisible(false);
        setIsVideoModalVisible(false);
        setEditingMeeting(null);
        setSelectedCommission(null);
        setCurrentMeetingForVideo(null);
        meetingForm.resetFields();
        commissionForm.resetFields();
        userForm.resetFields();
        message.info("Page state has been reset.");
        fetchData(true);
    }, [meetingForm, commissionForm, userForm, fetchData]);


    // --- Table Columns ---
    const meetingTableColumns = [
        {
            title: "Meeting & Commission",
            key: "details",
            render: (_, record) => {
                const commission = commissions.find((c) => c.id === record.commission_id);
                return (
                    <div>
                        <Text strong style={{ fontSize: '1.05em' }}>{record.title || "Untitled Meeting"}</Text>
                        {commission && (
                            <Tag icon={<TeamOutlined />} color="geekblue" style={{ marginLeft: 8, verticalAlign: 'middle' }}>
                                {commission.name}
                            </Tag>
                        )}
                        {record.location && (
                             <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '0.9em' }} copyable={{ text: record.location, tooltips: ['Copy Location', 'Location Copied!']}}>
                                <EnvironmentOutlined style={{ marginRight: 4 }} /> {record.location}
                            </Paragraph>
                        )}
                    </div>
                );
            },
            sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
        },
        {
            title: "Date & Time (Local)",
            dataIndex: "date",
            key: "date",
            width: 180,
            render: (dateStringUTC) => { // dateStringUTC is the UTC string from API
                if (!dateStringUTC) return <Tag>N/A</Tag>;
                const localMoment = moment.utc(dateStringUTC).local();
                if (!localMoment.isValid()) {
                    console.warn("Invalid date string received from API for table display:", dateStringUTC);
                    return <Tag color="error">Invalid Date</Tag>;
                }
                return (
                    <Tooltip title={localMoment.format("dddd, MMMM Do YYYY, h:mm:ss a Z")}>
                        {localMoment.format("YYYY-MM-DD HH:mm")}
                        <br />
                        <Text type="secondary" style={{ fontSize: '0.85em' }}>{localMoment.fromNow()}</Text>
                    </Tooltip>
                );
            },
            sorter: (a, b) => {
                const momentA = moment.utc(a.date || 0);
                const momentB = moment.utc(b.date || 0);
                if (!momentA.isValid() && !momentB.isValid()) return 0;
                if (!momentA.isValid()) return 1; // Invalid dates sort to the end
                if (!momentB.isValid()) return -1;
                return momentA.unix() - momentB.unix();
            },
            defaultSortOrder: 'ascend',
        },
        {
            title: "Actions",
            key: "actions",
            align: 'right',
            width: 180,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Join Video Call">
                        <Button shape="circle" icon={<VideoCameraAddOutlined />} onClick={() => handleJoinVideoCall(record)} disabled={!currentUser || !echo} />
                    </Tooltip>
                    <Tooltip title="Edit Meeting">
                        <Button shape="circle" icon={<EditOutlined />} onClick={() => showMeetingModal(record)} />
                    </Tooltip>
                    {record.commission_id && (
                        <Tooltip title="Manage Commission Users">
                            <Button shape="circle" icon={<UserAddOutlined />} onClick={() => showUserManagementModal(record.commission_id)} />
                        </Tooltip>
                    )}
                    <Tooltip title="Delete Meeting">
                        <Button shape="circle" danger icon={<DeleteOutlined />} onClick={() => confirmDelete('Meeting', record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // --- Custom Page Header ---
    const renderPageHeader = () => (
        <Card
            bordered={false}
            style={{ marginBottom: 20 }}
            bodyStyle={{ padding: '20px 24px' }}
        >
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col>
                    <Title level={2} style={{ margin: 0 }}>Meetings Dashboard</Title>
                    <Text type="secondary">Organize, view, and manage team meetings effectively.</Text>
                </Col>
                <Col>
                    <Space wrap>
                        <Tooltip title="Refresh Data">
                            <Button icon={<ReloadOutlined />} onClick={() => fetchData(true)} loading={loading && !isFetchingInitialData}>
                                Refresh
                            </Button>
                        </Tooltip>
                        <Tooltip title="Clear Filters & Reset Page">
                            <Button icon={<DeleteOutlined />} onClick={resetAllStates} danger>
                                Reset Page
                            </Button>
                        </Tooltip>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => showMeetingModal()} size="large">
                            Schedule Meeting
                        </Button>
                    </Space>
                </Col>
            </Row>
        </Card>
    );

    return (
        <div style={{ padding: "20px" }}>
            {renderPageHeader()}

            <Card
                title="Filter & Search Meetings"
                bordered={false}
                style={{ marginBottom: 20 }}
                extra={<Button type="link" onClick={clearFilters} icon={<FilterOutlined />}>Clear Filters</Button>}
            >
                <Form layout="vertical">
                    <Row gutter={[16, 0]}>
                        <Col xs={24} sm={24} md={8} lg={7} xl={6}>
                            <Form.Item label="Search by Keyword" style={{ marginBottom: 16 }}>
                                <Input
                                    placeholder="Title, location, commission..."
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
                                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={7} xl={6}>
                            <Form.Item label="Filter by Commission" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="All Commissions"
                                    value={filterCommissionId}
                                    onChange={handleCommissionFilterChange}
                                    allowClear style={{ width: '100%' }}
                                    loading={isFetchingInitialData && commissions.length === 0}
                                    showSearch optionFilterProp="children"
                                >
                                    {commissions.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12} md={8} lg={10} xl={12}>
                            <Form.Item label="Filter by Date Range" style={{ marginBottom: 16 }}>
                                <RangePicker
                                    value={filterDateRange}
                                    onChange={handleDateFilterChange}
                                    style={{ width: '100%' }}
                                    showTime={{ format: 'HH:mm' }}
                                    format="YYYY-MM-DD HH:mm"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Card>

            <Card bordered={false} title="Meeting List">
                <Skeleton loading={isFetchingInitialData && meetings.length === 0} active paragraph={{ rows: 5 }}>
                    <Table
                        columns={meetingTableColumns}
                        dataSource={filteredMeetings}
                        rowKey="id"
                        loading={loading && !isFetchingInitialData}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} meetings`,
                            position: ['bottomRight'],
                        }}
                        scroll={{ x: 'max-content' }}
                        size="middle"
                        locale={{ emptyText: filteredMeetings.length === 0 && (searchKeyword || filterCommissionId || filterDateRange) ? <Text>No meetings match your current filters. <Button type="link" onClick={clearFilters}>Clear filters</Button></Text> : <Text>No meetings scheduled yet. <Button type="link" onClick={() => showMeetingModal()}>Schedule one?</Button></Text> }}
                    />
                </Skeleton>
            </Card>

            {/* --- Modals --- */}
            <Modal
                title={editingMeeting ? "Edit Meeting Details" : "Schedule New Meeting"}
                open={isMeetingModalVisible}
                onCancel={() => closeModal('meeting')}
                footer={null}
                destroyOnClose
                maskClosable={false}
                width={680}
            >
                <Divider style={{ margin: '16px 0 24px 0' }} />
                <Form form={meetingForm} onFinish={handleMeetingFormSubmit} layout="vertical" requiredMark="optional">
                    <Form.Item name="title" label="Meeting Title" rules={[{ required: true, message: "Please enter a title" }]}>
                        <Input placeholder="e.g., Project Alpha Sync-up" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="date" label="Date & Time (Local)" rules={[{ required: true, message: "Please select date and time" }]}>
                                <DatePicker
                                    showTime={{ format: 'HH:mm' }} // User selects time in local
                                    format="YYYY-MM-DD HH:mm" // Display format for user in local
                                    style={{ width: "100%" }}
                                    placeholder="Select date & time"
                                    minuteStep={5}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="location" label="Location / Meeting Link" rules={[{ required: true, message: "Please enter location or link" }]}>
                                <Input placeholder="e.g., Conference Room B / https://meet.example.com/xyz" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="commission_id" label="Associated Commission" rules={[{ required: true, message: "A commission must be selected" }]}>
                        <Select
                            placeholder="Select commission"
                            loading={isFetchingInitialData && commissions.length === 0}
                            showSearch optionFilterProp="children"
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Button type="dashed" icon={<AppstoreAddOutlined />} onClick={showCommissionModal} style={{ width: "100%"}}>
                                        Create New Commission
                                    </Button>
                                </>
                            )}
                        >
                            {commissions.map((c) => (
                                <Option key={c.id} value={c.id}>
                                    <Space style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                        <span>{c.name}</span>
                                        <Tooltip title="Delete this Commission">
                                            <Button type="text" danger shape="circle" size="small" icon={<DeleteOutlined />}
                                                onClick={(e) => { e.stopPropagation(); confirmDelete('Commission', c); }}
                                            />
                                        </Tooltip>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name="gps" label="GPS Coordinates (Optional)">
                        <Input placeholder="e.g., 40.7128, -74.0060 (Latitude, Longitude)" />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginTop: '32px', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => closeModal('meeting')} disabled={modalLoading}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={modalLoading}>
                                {editingMeeting ? "Update Meeting" : "Schedule Meeting"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Create New Commission"
                open={isCommissionModalVisible}
                onCancel={() => closeModal('commission')}
                footer={null} destroyOnClose maskClosable={false}
            >
                <Divider style={{ margin: '16px 0 24px 0' }} />
                <Form form={commissionForm} onFinish={handleCommissionFormSubmit} layout="vertical" requiredMark="optional">
                    <Form.Item name="name" label="Commission Name" rules={[{ required: true, message: "Commission name is required" }]}>
                        <Input placeholder="e.g., Technical Committee" />
                    </Form.Item>
                    <Form.Item name="description" label="Description (Optional)">
                        <Input.TextArea placeholder="Briefly describe the commission's purpose" rows={3} />
                    </Form.Item>
                    <Form.Item name="members" label="Initial Members (Optional)">
                        <Select
                            mode="multiple"
                            placeholder="Select initial members (can be added later)"
                            allowClear showSearch optionFilterProp="label"
                            style={{ width: '100%' }}
                            loading={isFetchingInitialData && users.length === 0}
                            options={users.map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))}
                        />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginTop: '32px', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => closeModal('commission')} disabled={modalLoading}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={modalLoading}>Create Commission</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title={`Manage Members for "${selectedCommission?.name || 'Commission'}"`}
                open={isUserModalVisible}
                onCancel={() => closeModal('user')}
                footer={null} destroyOnClose maskClosable={false} width={600}
            >
                <Divider style={{ margin: '16px 0 24px 0' }} />
                <Alert
                    message="Commission Membership"
                    description="Select all users who should be members of this commission. Only members can join associated meeting video calls."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />
                <Form form={userForm} onFinish={handleUserFormSubmit} layout="vertical">
                    <Form.Item name="members" label="Select Members">
                        <Select
                            mode="multiple"
                            placeholder="Search and select users..."
                            allowClear showSearch optionFilterProp="label"
                            style={{ width: '100%' }}
                            loading={modalLoading || (isFetchingInitialData && users.length === 0)}
                            options={users.map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))}
                        />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginTop: '32px', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={() => closeModal('user')} disabled={modalLoading}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={modalLoading}>Save Members</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {currentMeetingForVideo && currentUser && echo && (
                <VideoChatModal
                    visible={isVideoModalVisible}
                    onClose={() => closeModal('video')}
                    meeting={currentMeetingForVideo}
                    echo={echo}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
}