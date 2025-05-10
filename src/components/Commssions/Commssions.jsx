import React, { useState, useEffect } from "react";
import axiosClient from "../../services/axios-client";
import {
    Table, Button, Modal, Form, Input, Typography, Space, message, Select, DatePicker,
    Card, Row, Col, Badge, Divider, Tooltip, Statistic
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserAddOutlined,
    CalendarOutlined, TeamOutlined, EnvironmentOutlined, ClockCircleOutlined,
    InfoCircleOutlined, FileTextOutlined, FilterOutlined, ReloadOutlined // Added ReloadOutlined
} from "@ant-design/icons";
import dayjs from 'dayjs'; // Import dayjs for reliable date comparison

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker; // Import RangePicker

export default function Commissions() {
    // --- State ---
    const [commissions, setCommissions] = useState([]); // Raw data from API
    const [filteredCommissions, setFilteredCommissions] = useState([]); // Data displayed in the table after filtering
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter States
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterMember, setFilterMember] = useState(null);
    const [filterDateRange, setFilterDateRange] = useState(null); // [dayjs_start, dayjs_end] or null

    // Modal States
    const [isModalVisible, setIsModalVisible] = useState(false); // Commission Add/Edit Modal
    const [isMeetingsModalVisible, setIsMeetingsModalVisible] = useState(false); // Meetings Modal
    const [isUserModalVisible, setIsUserModalVisible] = useState(false); // User Management Modal

    // Data for Modals/Actions
    const [editingCommission, setEditingCommission] = useState(null); // Commission being edited
    const [selectedCommission, setSelectedCommission] = useState(null); // Commission ID for meetings/users
    const [meetings, setMeetings] = useState([]); // Meetings for the selected commission

    // Forms
    const [meetingForm] = Form.useForm();
    const [commissionForm] = Form.useForm();
    const [userForm] = Form.useForm();

    // --- Data Fetching ---
    const fetchCommissions = async () => {
        setLoading(true);
        try {
            const { data } = await axiosClient.get("/commissions");
            const processedData = data.map(c => ({ ...c, members: c.members || [] }));
            setCommissions(processedData);
        } catch (error) {
            console.error("Failed to fetch commissions:", error);
            message.error("Failed to fetch commissions.");
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await axiosClient.get("/users");
            setUsers(data.data || []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            message.error("Failed to fetch users.");
        }
    };

    useEffect(() => {
        fetchCommissions();
        fetchUsers();
    }, []);

    // --- Filtering Logic ---
    const applyFilters = () => {
        let filtered = [...commissions];

        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase().trim();
            if (keyword) {
                filtered = filtered.filter(
                    (commission) =>
                        (commission.name && commission.name.toLowerCase().includes(keyword)) ||
                        (commission.description && commission.description.toLowerCase().includes(keyword))
                );
            }
        }

        if (filterMember) {
            filtered = filtered.filter(commission =>
                Array.isArray(commission.members) && commission.members.some(member => member.id === filterMember)
            );
        }

        if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
            const [start, end] = filterDateRange;
            const startDate = dayjs(start).startOf('day');
            const endDate = dayjs(end).endOf('day');

            filtered = filtered.filter(commission => {
                if (!commission.created_at) return false;
                try {
                   const createdAt = dayjs(commission.created_at);
                   if (!createdAt.isValid()) return false;
                   return !createdAt.isBefore(startDate) && !createdAt.isAfter(endDate);
                } catch (dateError) {
                    console.warn("Error parsing commission created_at date:", commission.created_at, dateError);
                    return false;
                }
            });
        }
        setFilteredCommissions(filtered);
    };

    useEffect(() => {
        if (!loading) {
             applyFilters();
        }
    }, [commissions, searchKeyword, filterMember, filterDateRange, loading]);


    // --- Filter Change Handlers ---
    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value);
    };

    const handleMemberFilterChange = (value) => {
        setFilterMember(value);
    };

    const handleDateFilterChange = (dates) => {
        setFilterDateRange(dates);
    };


    // --- Meetings Logic ---
    const fetchMeetings = async (commissionId) => {
        const commission = commissions.find(c => c.id === commissionId);
        if (!commission) return;
        setSelectedCommission(commission);
        setIsMeetingsModalVisible(true);
        try {
            const { data } = await axiosClient.get(`/commissions/${commissionId}/meetings`);
            setMeetings(data || []);
        } catch (error) {
            message.error(`Failed to fetch meetings for ${commission.name}.`);
            setMeetings([]);
        }
    };

    const handleAddMeeting = async (values) => {
        if (!selectedCommission || !selectedCommission.id) {
            message.error("No commission selected!");
            return;
        }
        const commissionId = selectedCommission.id;
        try {
            const payload = {
                ...values,
                date: values.date ? dayjs(values.date).format("YYYY-MM-DD HH:mm:ss") : null,
                commission_id: commissionId,
            };
            const { data: newMeeting } = await axiosClient.post(`/commissions/${commissionId}/meetings`, payload);
            setMeetings((prevMeetings) => [...prevMeetings, newMeeting]);
            message.success("Meeting added successfully");
            meetingForm.resetFields();
            fetchCommissions();
        } catch (error) {
            console.error("Failed to add meeting:", error.response?.data || error.message);
            message.error("Failed to add meeting.");
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        if (!selectedCommission || !selectedCommission.id) return;
        const commissionId = selectedCommission.id;

        Modal.confirm({
            title: 'Are you sure you want to delete this meeting?',
            content: 'This action cannot be undone.',
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await axiosClient.delete(`/meetings/${meetingId}`);
                    message.success("Meeting deleted successfully");
                    const { data } = await axiosClient.get(`/commissions/${commissionId}/meetings`);
                    setMeetings(data || []);
                    fetchCommissions();
                } catch (error) {
                    console.error("Failed to delete meeting:", error.response?.data || error.message);
                    message.error("Failed to delete meeting.");
                }
            }
        });
    };

    const handleCloseMeetingsModal = () => {
        setIsMeetingsModalVisible(false);
        setMeetings([]);
        setSelectedCommission(null);
        meetingForm.resetFields();
    };


    // --- Commission CRUD Logic ---
    const showCommissionModal = (commission = null) => {
        setEditingCommission(commission);
        if (commission) {
            commissionForm.setFieldsValue({ ...commission });
        } else {
            commissionForm.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCommissionFormSubmit = async (values) => {
        const action = editingCommission ? "update" : "create";
        const endpoint = editingCommission ? `/commissions/${editingCommission.id}` : "/commissions";
        const method = editingCommission ? "put" : "post";

        try {
            await axiosClient[method](endpoint, values);
            message.success(`Commission ${action}d successfully`);
            setIsModalVisible(false);
            commissionForm.resetFields();
            fetchCommissions();
        } catch (error) {
            const errorMsg = error.response?.data?.message || `Failed to ${action} commission.`;
             console.error(`Error ${action}ing commission:`, error.response?.data || error.message);
            if (error.response?.status === 422 && error.response?.data?.errors) {
                const validationErrors = Object.values(error.response.data.errors).flat().join(' ');
                message.error(`Failed to ${action} commission: ${validationErrors}`, 6);
            } else if (errorMsg.includes('Pusher error')) {
                message.warning(`Commission ${action}d, but notification broadcast failed.`, 5);
                setIsModalVisible(false);
                commissionForm.resetFields();
                fetchCommissions();
            } else {
                message.error(errorMsg);
            }
        }
    };

    const handleDeleteCommission = async (commission) => {
        Modal.confirm({
            title: `Delete '${commission.name}'?`,
            content: 'This will permanently delete the commission and all its associated meetings and member links. This action cannot be undone.',
            okText: 'Yes, Delete Permanently',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await axiosClient.delete(`/commissions/${commission.id}`);
                    message.success("Commission deleted successfully!");
                    fetchCommissions();
                    if (selectedCommission && selectedCommission.id === commission.id) {
                        handleCloseMeetingsModal();
                    }
                } catch (error) {
                    console.error("Failed to delete commission:", error.response?.data || error.message);
                    message.error("Failed to delete commission.");
                }
            }
        });
    };


    // --- User Management Logic ---
    const showUserModal = (commissionId) => {
        const commission = commissions.find(c => c.id === commissionId);
        if (!commission) return;
        setSelectedCommission(commission);
        userForm.setFieldsValue({
            members: Array.isArray(commission.members) ? commission.members.map(m => m.id) : []
        });
        setIsUserModalVisible(true);
    };

    const handleUserFormSubmit = async (values) => {
         if (!selectedCommission || !selectedCommission.id) {
            message.error("No commission selected!");
            return;
        }
        const commissionId = selectedCommission.id;
        try {
            await axiosClient.post(`/commissions/${commissionId}/users`, { user_ids: values.members || [] });
            message.success("Commission members updated successfully");
setIsUserModalVisible(false);
            userForm.resetFields();
            fetchCommissions();
        } catch (error) {
            console.error("Error updating users:", error.response?.data || error.message);
            message.error("Failed to update commission members.");
        }
    };

    const handleCloseUserModal = () => {
        setIsUserModalVisible(false);
        setSelectedCommission(null);
        userForm.resetFields();
    };


    // --- Table Columns Definition ---
    const columns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (text) => <Text strong>{text}</Text>,
        },
        {
            title: "Description",
            dataIndex: "description",
            key: "description",
            ellipsis: { showTitle: false },
            render: (text) => (
                <Tooltip placement="topLeft" title={text}>
                    <span style={{ display: 'inline-block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {text || '-'}
                    </span>
                </Tooltip>
            ),
        },
        {
            title: "Created",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
            render: (created_at) => {
                if (!created_at) return <Text type="secondary">N/A</Text>;
                const date = dayjs(created_at);
                 if (!date.isValid()) return <Text type="secondary">Invalid Date</Text>;
                return (
                    <Tooltip title={date.format('YYYY-MM-DD HH:mm:ss')}>
                        <Space direction="vertical" size={0}>
                            <Text>{date.format('YYYY-MM-DD')}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>{date.format('HH:mm')}</Text>
                        </Space>
                    </Tooltip>
                );
            },
        },
        {
            title: "Meetings",
            dataIndex: "meetings_count",
            key: "meetings_count",
             align: 'center',
            sorter: (a, b) => (a.meetings_count || 0) - (b.meetings_count || 0),
            render: (count, record) => (
                <Button
                    type="link"
                    onClick={() => fetchMeetings(record.id)}
                    icon={<CalendarOutlined />}
                    disabled={!record.id}
                >
                   <Badge count={count || 0} size="small" offset={[5, -3]} >
                        <span>{count || 0}</span>
                   </Badge>
                </Button>
            ),
        },
        {
            title: "Members",
            dataIndex: "members_count",
            key: "members_count",
            align: 'center',
            sorter: (a, b) => (a.members_count || 0) - (b.members_count || 0),
            render: (count, record) => (
                <Button
                    type="link"
                    onClick={() => showUserModal(record.id)}
                    icon={<TeamOutlined />}
                    disabled={!record.id}
                >
                    <Badge count={count || 0} size="small" offset={[5, -3]} >
                       <span>{count || 0}</span>
                    </Badge>
                </Button>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            align: 'center',
            width: 180,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit Commission">
                        <Button type="primary" icon={<EditOutlined />} onClick={() => showCommissionModal(record)} shape="circle" />
                    </Tooltip>
                    <Tooltip title="Manage Members">
                        <Button type="default" icon={<UserAddOutlined />} onClick={() => showUserModal(record.id)} shape="circle" style={{ color: '#1890ff', borderColor: '#1890ff' }} />
                    </Tooltip>
                     <Tooltip title="View Meetings">
                        <Button type="default" icon={<CalendarOutlined />} onClick={() => fetchMeetings(record.id)} shape="circle" />
                    </Tooltip>
                    <Tooltip title="Delete Commission">
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteCommission(record)} shape="circle" />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // --- Render ---
    return (
        <div className="commissions-container" style={{ padding: "24px" }}>
            {/* Page Header Card */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={2} style={{ margin: 0 }}>Commissions Management</Title>
                        <Text type="secondary">Manage commissions, meetings, and members.</Text>
                    </Col>
                    <Col>
                        <Space>
                            <Tooltip title="Refresh Data">
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={fetchCommissions}
                                    size="large"
                                    loading={loading}
                                />
                            </Tooltip>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={() => showCommissionModal()}
                                size="large"
                            >
                                New Commission
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Filter Card */}
            <Card
                bordered={false}
                style={{ marginBottom: 16 }}
                title={<Space><FilterOutlined /> Filters</Space>}
            >
                <Row gutter={[16, 16]} align="bottom">
                    <Col xs={24} sm={12} md={8} lg={7}>
                         <Form.Item label="Search" style={{ marginBottom: 0 }}>
                            <Input
                                placeholder="Name or description..."
                                value={searchKeyword}
                                onChange={handleSearchChange}
                                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                allowClear
                            />
                         </Form.Item>
                    </Col>
                    <Col xs={24} sm={12} md={8} lg={7}>
                        <Form.Item label="Filter by Member" style={{ marginBottom: 0 }}>
                            <Select
                                placeholder="Select a member"
                                value={filterMember}
                                onChange={handleMemberFilterChange}
                                allowClear
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                style={{ width: '100%' }}
                                loading={!users.length}
                            >
                                {users.map((user) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col xs={24} sm={24} md={8} lg={10}>
                         <Form.Item label="Filter by Creation Date" style={{ marginBottom: 0 }}>
                            <RangePicker
                                value={filterDateRange}
                                onChange={handleDateFilterChange}
                                style={{ width: '100%' }}
                            />
                         </Form.Item>
                    </Col>
                </Row>
            </Card>

            {/* Data Table Card */}
            <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={filteredCommissions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10, // Default items per page
                        showSizeChanger: false, // Removes the page size changer
                        // pageSizeOptions: ['10', '20', '50', '100'], // This line is removed
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} commissions`,
                    }}
                    scroll={{ x: 'max-content' }}
                    rowClassName="commission-table-row"
                    onChange={(pagination, filters, sorter) => {
                        // console.log('Table changed:', pagination, filters, sorter);
                    }}
                />
            </Card>

            {/* --- Modals --- */}

            {/* Meetings Modal */}
            <Modal
                title={
                    <Space>
                        <CalendarOutlined />
                        <span>Meetings for: {selectedCommission?.name || 'Commission'}</span>
                    </Space>
                }
                open={isMeetingsModalVisible}
                onCancel={handleCloseMeetingsModal}
                footer={null}
                width={800}
                destroyOnClose
                className="meetings-modal"
            >
                <Title level={5} style={{ marginBottom: 16 }}>Existing Meetings</Title>
                <Table
                    dataSource={meetings}
                    rowKey="id"
                    columns={[
                        { title: "Title", dataIndex: "title", key: "title", render: (text) => <Text strong>{text}</Text> },
                        {
                            title: "Date & Time", dataIndex: "date", key: "date", render: (date) => {
                                const d = dayjs(date);
                                return d.isValid() ? d.format('YYYY-MM-DD HH:mm') : 'Invalid Date';
                            }
                        },
                        { title: "Location", dataIndex: "location", key: "location", render: (text) => <Space><EnvironmentOutlined />{text}</Space> },
                        { title: "GPS", dataIndex: "gps", key: "gps", render: (text) => text || '-' },
                        {
                            title: "Actions", key: "actions", width: 80, align: 'center', render: (_, record) => (
                                <Tooltip title="Delete Meeting">
                                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDeleteMeeting(record.id)} shape="circle" size="small" />
                                </Tooltip>
                            )
                        },
                    ]}
                    pagination={{ pageSize: 5, size: 'small' }}
                    locale={{ emptyText: <Text type="secondary">No meetings found.</Text> }}
                    size="small"
                />
                <Divider orientation="left" style={{ marginTop: 24 }}>Add New Meeting</Divider>
                <Form form={meetingForm} onFinish={handleAddMeeting} layout="vertical">
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="title" label="Meeting Title" rules={[{ required: true, message: "Title is required" }]}>
                                <Input placeholder="Enter meeting title" prefix={<FileTextOutlined />} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="date" label="Date & Time" rules={[{ required: true, message: "Date and time are required" }]}>
                                <DatePicker style={{ width: "100%" }} showTime format="YYYY-MM-DD HH:mm" placeholder="Select date and time"/>
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="location" label="Location" rules={[{ required: true, message: "Location is required" }]}>
                                <Input placeholder="Enter meeting location" prefix={<EnvironmentOutlined />} />
                            </Form.Item>
                        </Col>
                         <Col span={24}>
                             <Form.Item name="gps" label="GPS Coordinates" tooltip={{ title: "Optional: Latitude,Longitude format", icon: <InfoCircleOutlined /> }}>
                                <Input placeholder="e.g., 40.7128,-74.0060 (optional)" />
                            </Form.Item>
                         </Col>
                    </Row>
                    <Form.Item style={{ textAlign: 'right', marginTop: 8, marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                            Add Meeting
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Commission Add/Edit Modal */}
            <Modal
                title={
                    <Space>
                        {editingCommission ? <EditOutlined /> : <PlusOutlined />}
                        <span>{editingCommission ? "Edit Commission" : "Add New Commission"}</span>
                    </Space>
                }
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
                width={600}
                destroyOnClose
                className="commission-modal"
            >
                <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form
                    form={commissionForm}
                    onFinish={handleCommissionFormSubmit}
                    layout="vertical"
                    initialValues={{ name: "", description: "" }}
                >
                    <Form.Item name="name" label="Commission Name" rules={[{ required: true, message: "Please enter the commission name" }]}>
                        <Input placeholder="Enter commission name" />
                    </Form.Item>
                    <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please enter a description" }]}>
                        <TextArea placeholder="Describe the commission's purpose" rows={4} showCount maxLength={500} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
                            <Button type="primary" htmlType="submit">
                                {editingCommission ? "Update Commission" : "Create Commission"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* User Management Modal */}
            <Modal
                title={
                    <Space>
                        <TeamOutlined />
                        <span>Manage Members for: {selectedCommission?.name || 'Commission'}</span>
                    </Space>
                }
                open={isUserModalVisible}
                onCancel={handleCloseUserModal}
                footer={null}
                width={600}
                destroyOnClose
                className="user-modal"
            >
                 <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form form={userForm} onFinish={handleUserFormSubmit} layout="vertical">
                    <Form.Item
                        name="members"
                        label="Assign Members"
                        tooltip="Select users who are members of this commission."
                    >
                        <Select
                            mode="multiple"
                            placeholder="Select members..."
                            style={{ width: '100%' }}
                            optionFilterProp="children"
                            showSearch
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                            loading={!users.length}
                        >
                            {users.map((user) => (
                                <Option key={user.id} value={user.id}>
                                    {user.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
                        <Space>
                            <Button onClick={handleCloseUserModal}>Cancel</Button>
                            <Button type="primary" htmlType="submit" icon={<UserAddOutlined />}>
                                Update Members
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}