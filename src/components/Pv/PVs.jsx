import React, { useState, useEffect } from "react";
import {
    Table, Button, Modal, Form, Input, Typography, Space, message, Select, DatePicker,
    Card, Row, Col, Divider, Tooltip, Tag // Added Card, Row, Col, Divider, Tooltip, Tag
} from "antd";
import {
    PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, // Changed PDF icon
    SearchOutlined, FilterOutlined, CalendarOutlined, TeamOutlined // Added Filter and context icons
} from "@ant-design/icons";
import moment from "moment"; // Keep moment for date handling
import { PvService } from "../../services/PvService";
// Assuming axiosClient is still needed for potential direct calls, otherwise remove if PvService handles all
// import axiosClient from "../axios-client.js";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker; // Import RangePicker for date filtering

export default function PVs() {
    // --- State ---
    // Data
    const [pvs, setPVs] = useState([]); // Raw data from service
    const [filteredPVs, setFilteredPVs] = useState([]); // Data displayed in table
    const [meetings, setMeetings] = useState([]);
    const [commissions, setCommissions] = useState([]);
    // Users might not be directly needed unless filtering/displaying user info related to PVs/Meetings
    // const [users, setUsers] = useState([]);

    // Loading & UI Control
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false); // PV Add/Edit Modal
    const [isMeetingModalVisible, setIsMeetingModalVisible] = useState(false); // Add Meeting Modal

    // Editing/Selection State
    const [editingPV, setEditingPV] = useState(null);

    // Filter States
    const [searchKeyword, setSearchKeyword] = useState("");
    const [filterMeetingId, setFilterMeetingId] = useState(null);
    const [filterCommissionId, setFilterCommissionId] = useState(null);
    const [filterDateRange, setFilterDateRange] = useState(null); // [moment_start, moment_end]

    // Forms
    const [form] = Form.useForm(); // PV Form
    const [meetingForm] = Form.useForm(); // Meeting Form

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all required data concurrently
            const [pvsData, meetingsData, commissionsData/*, usersData*/] = await Promise.all([
                PvService.fetchPVs(),
                PvService.fetchMeetings(),
                PvService.fetchCommissions(),
                // PvService.fetchUsers(), // Uncomment if users are needed
            ]);
            setPVs(pvsData || []);
            // Initial filtering will be handled by useEffect
            setMeetings(meetingsData || []);
            setCommissions(commissionsData || []);
            // setUsers(usersData || []);
        } catch (error) {
             console.error("Fetch Data Error:", error);
            // Use error.message if PvService provides it, otherwise a generic message
            message.error(error?.message || "Failed to load required data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- Filtering Logic ---
    const applyFilters = () => {
        let filtered = [...pvs]; // Start with the original list

        // Find related meetings and commissions for easier access
        const getMeeting = (pv) => meetings.find(m => m.id === pv.meeting_id);
        const getCommission = (meeting) => meeting ? commissions.find(c => c.id === meeting.commission_id) : null;

        // 1. Keyword Filter (PV Content, Meeting Title, Commission Name)
        if (searchKeyword) {
            const keyword = searchKeyword.toLowerCase().trim();
            if (keyword) {
                filtered = filtered.filter((pv) => {
                    const meeting = getMeeting(pv);
                    const commission = getCommission(meeting);
                    const meetingTitle = meeting ? meeting.title.toLowerCase() : "";
                    const commissionName = commission ? commission.name.toLowerCase() : "";
                    return (
                        (pv.content && pv.content.toLowerCase().includes(keyword)) ||
                        meetingTitle.includes(keyword) ||
                        commissionName.includes(keyword)
                    );
                });
            }
        }

        // 2. Meeting Filter
        if (filterMeetingId) {
            filtered = filtered.filter(pv => pv.meeting_id === filterMeetingId);
        }

        // 3. Commission Filter
        if (filterCommissionId) {
            // Find all meeting IDs belonging to the selected commission
            const commissionMeetingIds = meetings
                .filter(m => m.commission_id === filterCommissionId)
                .map(m => m.id);
            // Filter PVs whose meeting_id is in this list
            filtered = filtered.filter(pv => commissionMeetingIds.includes(pv.meeting_id));
        }

        // 4. Date Range Filter (Based on Meeting Date)
        if (filterDateRange && filterDateRange[0] && filterDateRange[1]) {
            const [start, end] = filterDateRange;
            const startDate = moment(start).startOf('day');
            const endDate = moment(end).endOf('day');

            // Find meeting IDs within the date range
            const dateRangeMeetingIds = meetings.filter(m => {
                if (!m.date) return false;
                try {
                    const meetingDate = moment(m.date);
                    return meetingDate.isValid() && meetingDate.isBetween(startDate, endDate, null, '[]');
                } catch (e) { return false; }
            }).map(m => m.id);

            // Filter PVs whose meeting_id is in this list
             filtered = filtered.filter(pv => dateRangeMeetingIds.includes(pv.meeting_id));
        }

        setFilteredPVs(filtered);
    };

    // Apply filters whenever source data or filter criteria change
    useEffect(() => {
         // Avoid running filters before essential data is loaded
        if (pvs.length > 0 || meetings.length > 0 || commissions.length > 0 || searchKeyword || filterMeetingId || filterCommissionId || filterDateRange) {
            applyFilters();
        } else {
            // Handle initial state or empty data scenario
             setFilteredPVs(pvs);
        }
        // Dependencies: include all data sources and filter states
    }, [pvs, meetings, commissions, searchKeyword, filterMeetingId, filterCommissionId, filterDateRange]);


    // --- Filter Change Handlers ---
    const handleSearchChange = (e) => {
        setSearchKeyword(e.target.value);
    };
    const handleMeetingFilterChange = (value) => {
         setFilterMeetingId(value);
    };
    const handleCommissionFilterChange = (value) => {
         setFilterCommissionId(value);
    };
    const handleDateFilterChange = (dates) => {
         setFilterDateRange(dates); // dates is [moment_start, moment_end] or null
    };

    // --- CRUD Operations ---

    // Handle PV form submission (add or update)
    const handleFormSubmit = async (values) => {
        const isEditing = !!editingPV;
        const action = isEditing ? "update" : "create";
        setLoading(true); // Show loading indicator on submit button maybe? Or on modal?
        try {
            let resultPV;
            if (isEditing) {
                resultPV = await PvService.updatePV(editingPV.id, values);
            } else {
                resultPV = await PvService.createPV(values);
            }
             message.success(`PV ${action}d successfully`);
            fetchData(); // Re-fetch all data to ensure consistency
            handleCancel(); // Close modal and reset form
        } catch (error) {
            console.error(`Error ${action}ing PV:`, error);
            message.error(error?.message || `Failed to ${action} PV.`);
            // Optionally handle validation errors from service if provided
            // if (error?.validationErrors) form.setFields(...)
        } finally {
            setLoading(false);
        }
    };

    // Handle delete PV - Use Modal.confirm
    const handleDeletePV = (pv) => {
        Modal.confirm({
             title: 'Delete PV?',
             // Try to find meeting title for better context
             content: `Are you sure you want to delete the PV for meeting: "${meetings.find(m => m.id === pv.meeting_id)?.title || 'Unknown Meeting'}"? This cannot be undone.`,
             okText: 'Yes, Delete',
             okType: 'danger',
             cancelText: 'Cancel',
             onOk: async () => {
                setLoading(true);
                try {
                    await PvService.deletePV(pv.id);
                    message.success("PV deleted successfully");
                    fetchData(); // Refresh data
                } catch (error) {
                    console.error("Delete PV Error:", error);
                    message.error(error?.message || "Failed to delete PV.");
                } finally {
                    setLoading(false);
                }
             }
        });
    };

    // Handle create meeting
    const handleCreateMeeting = async (values) => {
        setLoading(true);
        try {
            const formattedValues = {
                ...values,
                // Ensure date format matches backend expectation
                date: values.date ? moment(values.date).format("YYYY-MM-DD HH:mm:ss") : null,
            };
            const newMeeting = await PvService.createMeeting(formattedValues);
            message.success("Meeting created successfully");
            await fetchData(); // Refresh all data
            // Auto-select the new meeting in the PV form if it's open
             if (isModalVisible) {
                 form.setFieldsValue({ meeting_id: newMeeting.id });
             }
            handleMeetingCancel(); // Close meeting modal
        } catch (error) {
             console.error("Create Meeting Error:", error);
             message.error(error?.message || "Failed to create meeting.");
              // Optionally handle validation errors from service if provided
             // if (error?.validationErrors) meetingForm.setFields(...)
        } finally {
             setLoading(false);
        }
    };

    // Handle delete meeting - Use Modal.confirm
    const handleDeleteMeeting = (meetingId, meetingTitle) => {
        Modal.confirm({
            title: 'Delete Meeting?',
            content: `Are you sure you want to delete the meeting: "${meetingTitle || 'this meeting'}"? Associated PVs might be affected.`,
            okText: 'Yes, Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                setLoading(true);
                 try {
                    await PvService.deleteMeeting(meetingId);
                    message.success("Meeting deleted successfully");
                    fetchData(); // Refresh data
                    // If the PV modal was open and had this meeting selected, clear it
                    if (isModalVisible && form.getFieldValue('meeting_id') === meetingId) {
                        form.setFieldsValue({ meeting_id: undefined });
                    }
                } catch (error) {
                    console.error("Delete Meeting Error:", error);
                    message.error(error?.message || "Failed to delete meeting.");
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // Handle generate text file
    const handleGenerateText = async (pvId) => {
        setLoading(true); // Indicate processing
         message.loading('Generating report...', 0); // Show indefinite loading message
        try {
            const response = await PvService.generateText(pvId); // Service returns blob data
             message.destroy(); // Close loading message

            // Find meeting title for filename
            const pv = pvs.find(p => p.id === pvId);
            const meeting = pv ? meetings.find(m => m.id === pv.meeting_id) : null;
            const meetingTitle = meeting ? meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'pv_report';
            const filename = `${meetingTitle}_${moment().format('YYYYMMDD')}.txt`;

            const url = window.URL.createObjectURL(new Blob([response], { type: 'text/plain' })); // Specify MIME type
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url); // Clean up blob URL
             message.success("Report generated successfully.");
        } catch (error) {
            message.destroy(); // Close loading message on error
            console.error("Failed to generate text file:", error);
            message.error(error?.message || error?.response?.data?.error || "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Control ---
    const showModal = (pv = null) => {
        setEditingPV(pv);
        if (pv) {
            form.setFieldsValue({ ...pv }); // Assumes PV object matches form fields
        } else {
            form.resetFields();
        }
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setEditingPV(null);
    };

    const showMeetingModal = () => {
        meetingForm.resetFields();
        setIsMeetingModalVisible(true);
    };

    const handleMeetingCancel = () => {
        setIsMeetingModalVisible(false);
        meetingForm.resetFields();
    };

    // --- Table Columns (Modernized) ---
    const columns = [
        {
            title: "PV Details",
            key: "details",
            render: (_, record) => {
                const meeting = meetings.find((m) => m.id === record.meeting_id);
                const commission = meeting ? commissions.find((c) => c.id === meeting.commission_id) : null;
                const meetingDate = meeting?.date ? moment(meeting.date) : null;

                return (
                    <Space direction="vertical" size="small">
                        <Text strong>
                            Meeting: {meeting ? meeting.title : <Text type="danger">Meeting not found</Text>}
                        </Text>
                        {commission && <Tag icon={<TeamOutlined />} color="blue">{commission.name}</Tag>}
                        {meetingDate?.isValid() && (
                            <Text type="secondary" style={{ fontSize: '0.85em' }}>
                                <CalendarOutlined style={{ marginRight: 5 }} /> {meetingDate.format("ddd, MMM D, YYYY, h:mm A")}
                            </Text>
                        )}
                         {/* Display a snippet of the content */}
                        <Text ellipsis={{ rows: 2, expandable: true, symbol: 'more' }}>
                            {record.content || <Text type="secondary">No content</Text>}
                        </Text>
                    </Space>
                );
            },
        },
        // Content column removed as it's integrated above
        {
            title: "Actions",
            key: "actions",
            align: 'right',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Generate Text Report">
                        <Button
                            shape="circle"
                            icon={<FileTextOutlined />}
                            onClick={() => handleGenerateText(record.id)}
                        />
                    </Tooltip>
                    <Tooltip title="Edit PV">
                        <Button shape="circle" icon={<EditOutlined />} onClick={() => showModal(record)} />
                    </Tooltip>
                    <Tooltip title="Delete PV">
                        <Button shape="circle" danger icon={<DeleteOutlined />} onClick={() => handleDeletePV(record)} />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // --- Render ---
    return (
        <div style={{ padding: "24px" }}>
            {/* Header Card */}
            <Card bordered={false} style={{ marginBottom: 16 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Title level={3} style={{ margin: 0 }}>Génération des PV</Title>
                        <Text type="secondary">Manage meeting minutes (PVs).</Text>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => showModal()}
                            size="large"
                        >
                            Add PV
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* Filter Card */}
            <Card bordered={false} style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 0 }}>
                 <Form layout="vertical">
                     <Row gutter={[16, 0]} align="bottom">
                        {/* Keyword Search */}
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label="Search" style={{ marginBottom: 16 }}>
                                <Input
                                    placeholder="Content, meeting, commission..."
                                    value={searchKeyword}
                                    onChange={handleSearchChange}
                                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        {/* Filter by Meeting */}
                         <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label="Filter by Meeting" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="All Meetings"
                                    value={filterMeetingId}
                                    onChange={handleMeetingFilterChange}
                                    allowClear showSearch optionFilterProp="children"
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    style={{ width: '100%' }}
                                    loading={meetings.length === 0 && loading}
                                >
                                    {meetings.map((meeting) => (
                                        <Option key={meeting.id} value={meeting.id}>
                                            {meeting.title}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                         {/* Filter by Commission */}
                         <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label="Filter by Commission" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="All Commissions"
                                    value={filterCommissionId}
                                    onChange={handleCommissionFilterChange}
                                    allowClear showSearch optionFilterProp="children"
                                     filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    style={{ width: '100%' }}
                                    loading={commissions.length === 0 && loading}
                                >
                                    {commissions.map((commission) => (
                                        <Option key={commission.id} value={commission.id}>
                                            {commission.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                         </Col>
                         {/* Filter by Date Range (Meeting Date) */}
                         <Col xs={24} sm={12} md={24} lg={6}>
                            <Form.Item label="Filter by Meeting Date" style={{ marginBottom: 16 }}>
                                <RangePicker
                                    value={filterDateRange}
                                    onChange={handleDateFilterChange}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                         </Col>
                    </Row>
                </Form>
            </Card>

            {/* PVs Table Card */}
             <Card bordered={false}>
                <Table
                    columns={columns}
                    dataSource={filteredPVs}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                         pageSizeOptions: ['10', '20', '50'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} PVs`
                    }}
                    scroll={{ x: 'max-content' }} // Enable horizontal scroll if needed
                />
            </Card>

             {/* --- Modals --- */}

            {/* Add/Edit PV Modal */}
             <Modal
                title={editingPV ? "Edit PV" : "Add New PV"}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null} // Custom footer inside Form
                destroyOnClose
                maskClosable={false}
                width={700} // Adjust width for content area
            >
                <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form form={form} onFinish={handleFormSubmit} layout="vertical" requiredMark="optional">
                    <Form.Item
                        name="meeting_id"
                        label="Select Meeting"
                        rules={[{ required: true, message: "Please select the relevant meeting" }]}
                    >
                        <Select
                            placeholder="Search and select a meeting..."
                            showSearch
                            optionFilterProp="children" // Search based on the displayed text (Meeting Title)
                             filterOption={(input, option) =>
                                option.children[0].toLowerCase().includes(input.toLowerCase()) // Index 0 is the title span
                             }
                            loading={meetings.length === 0 && loading}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Button type="link" icon={<PlusOutlined />} onClick={showMeetingModal} style={{ width: "100%"}}>
                                        Create New Meeting
                                    </Button>
                                </>
                            )}
                        >
                            {meetings.map((meeting) => (
                                <Option key={meeting.id} value={meeting.id}>
                                    {/* Use Space to allow delete button without breaking search */}
                                    <Space style={{ display: 'flex', justifyContent: 'space-between' }}>
                                       <span>{meeting.title} ({moment(meeting.date).format('YYYY-MM-DD')})</span>
                                        <Tooltip title="Delete Meeting">
                                            <Button
                                                type="text" danger shape="circle" size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent dropdown close
                                                    handleDeleteMeeting(meeting.id, meeting.title);
                                                }}
                                                // Disable deleting if this meeting is selected in an *editing* PV?
                                                // disabled={editingPV && editingPV.meeting_id === meeting.id}
                                            />
                                        </Tooltip>
                                    </Space>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="PV Content / Minutes"
                        rules={[{ required: true, message: "Please enter the content of the minutes" }]}
                    >
                        <Input.TextArea placeholder="Enter detailed minutes, decisions, action items..." rows={10} />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginTop: '24px', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={handleCancel}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                {editingPV ? "Update PV" : "Save PV"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Add Meeting Modal */}
            <Modal
                title="Create New Meeting"
                open={isMeetingModalVisible}
                onCancel={handleMeetingCancel}
                footer={null} // Custom footer inside Form
                destroyOnClose
                maskClosable={false}
                 width={600}
            >
                <Divider style={{ margin: '12px 0 24px 0' }} />
                <Form form={meetingForm} onFinish={handleCreateMeeting} layout="vertical" requiredMark="optional">
                    <Form.Item name="title" label="Meeting Title" rules={[{ required: true }]}>
                        <Input placeholder="Enter meeting title" />
                    </Form.Item>
                     <Row gutter={16}>
                         <Col span={12}>
                            <Form.Item name="date" label="Date & Time" rules={[{ required: true }]}>
                                <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: "100%" }} placeholder="Select date & time"/>
                            </Form.Item>
                         </Col>
                         <Col span={12}>
                            <Form.Item name="location" label="Location" rules={[{ required: true }]}>
                                <Input placeholder="e.g., Conf Room B, Online" />
                            </Form.Item>
                         </Col>
                    </Row>
                    <Form.Item name="commission_id" label="Associated Commission" rules={[{ required: true }]}>
                        <Select placeholder="Select the relevant commission" showSearch optionFilterProp="children">
                            {commissions.map((commission) => (
                                <Option key={commission.id} value={commission.id}>
                                    {commission.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                     <Form.Item
                        name="gps"
                        label="GPS Coordinates (Optional)"
                         rules={[{
                            validator: (_, value) => {
                                // Allow empty or valid format
                                if (!value || /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(value.trim())) {
                                    return Promise.resolve();
                                }
                                return Promise.reject("Invalid format (e.g., 12.34, -56.78)");
                            }
                        }]}
                     >
                        <Input placeholder="Enter latitude, longitude (optional)" />
                    </Form.Item>

                    <Form.Item style={{ textAlign: 'right', marginTop: '24px', marginBottom: 0 }}>
                        <Space>
                            <Button onClick={handleMeetingCancel}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={loading}>Create Meeting</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}