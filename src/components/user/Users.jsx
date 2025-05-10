import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useStateContext } from "../../context/ContextProvider.jsx";
import {
    Table, Button, Typography, Space, message, Dropdown, Menu, Tag, Modal, Select, Input,
    Card, Row, Col, Avatar, Tooltip, Divider,Form // Added Card, Row, Col, Avatar, Tooltip, Divider
} from "antd";
import {
    EditOutlined, DeleteOutlined, PlusOutlined, DownOutlined, CloseOutlined, SearchOutlined, FilterOutlined, // Added Search, Filter
    UserOutlined, SafetyCertificateOutlined, MoreOutlined // Added User, Safety, More icons
} from "@ant-design/icons";
import {
    getUsers as fetchUsersApi, // Renamed for clarity
    fetchPermissions as fetchPermissionsApi,
    deleteUser as deleteUserApi,
    updateUserRole as updateUserRoleApi,
    updateUserPermissions as updateUserPermissionsApi,
    createPermission as createNewPermissionApi,
    deletePermission as removePermissionApi,
} from "../../services/userServices.js";
import echo from "../../services/echo.js";
import moment from 'moment'; // For formatting created_at date

const { Title, Text } = Typography;
const { Option } = Select;

// Role definitions for consistency and potential styling
const ROLES = {
    user: { name: "User", color: "default" },
    admin: { name: "Admin", color: "processing" },
    superadmin: { name: "Super Admin", color: "success" },
};

export default function Users() {
    // --- State ---
    const [users, setUsers] = useState([]); // Raw user data
    const [filteredUsers, setFilteredUsers] = useState([]); // Users displayed in table
    const [loading, setLoading] = useState(false);
    const [permissionsList, setPermissionsList] = useState([]);

    // Modal State
    const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    // Note: Global permission creation/deletion might be better in a dedicated settings area
    // const [newPermissionName, setNewPermissionName] = useState("");

    // Filter State
    const [filterNameEmail, setFilterNameEmail] = useState("");
    const [filterRole, setFilterRole] = useState(null); // null or 'user'/'admin'/'superadmin'
    const [filterStatus, setFilterStatus] = useState(null); // null or 'online'/'offline'
    const [filterPermission, setFilterPermission] = useState(null); // null or permission ID

    const { setNotification, user: currentUser } = useStateContext();

    // --- Helper Functions ---
    const isUserOnline = useCallback((lastSeen) => {
        if (!lastSeen) return false;
        try {
            const lastSeenDate = moment(lastSeen);
            return lastSeenDate.isValid() && moment().diff(lastSeenDate, 'minutes') < 5;
        } catch (e) {
            console.error('Error parsing last_seen_at:', lastSeen, e);
            return false;
        }
    }, []);

    // --- Data Fetching & Real-time ---
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Use Promise.all for concurrent fetching
            const [usersResponse, permissionsResponse] = await Promise.all([
                fetchUsersApi(),
                fetchPermissionsApi()
            ]);
            // Ensure data format is correct and default to empty arrays
            setUsers(usersResponse?.data?.data || []);
            setPermissionsList(permissionsResponse?.data || []);
            // Initial filtering will be handled by the useEffect below
        } catch (error) {
            console.error('Error loading data:', error);
            message.error("Failed to load user or permission data.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(); // Initial load

        // --- Real-time listener ---
        const channel = echo.channel('user-status');
        const listener = (data) => {
            // console.log('Received event .user.activity.updated:', data);
            if (data?.user?.id && data?.user?.last_seen_at) {
                setUsers((prevUsers) =>
                    prevUsers.map((user) =>
                        user.id === data.user.id ? { ...user, last_seen_at: data.user.last_seen_at } : user
                    )
                );
            }
        };

        channel.listen('.user.activity.updated', listener);
        console.log('Subscribed to user-status channel');

        // Cleanup function
        return () => {
            channel.stopListening('.user.activity.updated', listener);
            echo.leaveChannel('user-status');
            console.log('Unsubscribed from user-status channel');
        };
    }, [loadData]); // Depend on loadData

    // --- Filtering Logic ---
    const applyFilters = useCallback(() => {
        let filtered = [...users];

        // 1. Filter by Name/Email
        if (filterNameEmail) {
            const keyword = filterNameEmail.toLowerCase().trim();
            filtered = filtered.filter(user =>
                (user.name && user.name.toLowerCase().includes(keyword)) ||
                (user.email && user.email.toLowerCase().includes(keyword))
            );
        }

        // 2. Filter by Role
        if (filterRole) {
            filtered = filtered.filter(user => user.role === filterRole);
        }

        // 3. Filter by Status
        if (filterStatus) {
            const checkOnline = filterStatus === 'online';
            filtered = filtered.filter(user => isUserOnline(user.last_seen_at) === checkOnline);
        }

        // 4. Filter by Permission
        if (filterPermission) {
             filtered = filtered.filter(user =>
                user.permissions && user.permissions.some(p => p.id === filterPermission)
             );
        }


        setFilteredUsers(filtered);
    }, [users, filterNameEmail, filterRole, filterStatus, filterPermission, isUserOnline]); // Add isUserOnline dependency

    // Apply filters whenever users or filter criteria change
    useEffect(() => {
        applyFilters();
    }, [applyFilters]); // Depend on the memoized applyFilters function

    // --- Filter Change Handlers ---
    const handleNameEmailFilterChange = (e) => setFilterNameEmail(e.target.value);
    const handleRoleFilterChange = (value) => setFilterRole(value);
    const handleStatusFilterChange = (value) => setFilterStatus(value);
    const handlePermissionFilterChange = (value) => setFilterPermission(value);


    // --- CRUD Operations ---
    const onDeleteClick = (user) => {
        Modal.confirm({
             title: `Delete User: ${user.name}?`,
             content: `Are you sure you want to permanently delete ${user.email}? This action cannot be undone.`,
             okText: 'Yes, Delete',
             okType: 'danger',
             cancelText: 'Cancel',
             onOk: async () => {
                try {
                    await deleteUserApi(user.id);
                    setNotification("User was successfully deleted");
                    message.success("User deleted successfully");
                    loadData(); // Refresh data
                } catch (error) {
                    console.error('Error deleting user:', error);
                    message.error(error?.response?.data?.message || "Failed to delete user");
                }
             }
        });
    };

    const handleRoleChange = async (userId, newRole) => {
        if (currentUser.role !== "superadmin" && newRole === "superadmin") {
            message.error("Only Super Admins can assign the Super Admin role.");
            return;
        }
        // Add check: Don't allow user to demote themselves from superadmin? (Optional)
        // if (currentUser.id === userId && currentUser.role === "superadmin" && newRole !== "superadmin") {
        //     message.error("Super Admins cannot change their own role.");
        //     return;
        // }

        try {
            await updateUserRoleApi(userId, newRole);
            setNotification("User role updated successfully");
            message.success("Role updated successfully");
            loadData(); // Refresh
        } catch (error) {
            console.error('Error updating role:', error);
            message.error(error?.response?.data?.message || "Failed to update role");
        }
    };

    // --- Permission Management ---
    const openPermissionModal = (user) => {
        setSelectedUser(user);
        setIsPermissionModalVisible(true);
    };

    const closePermissionModal = () => {
        setIsPermissionModalVisible(false);
        setSelectedUser(null);
        // setNewPermissionName(""); // If global creation was here
    };

    const handlePermissionChange = async (selectedPermissionIds) => {
        if (!selectedUser) return;
        try {
            await updateUserPermissionsApi(selectedUser.id, selectedPermissionIds);
            setNotification("User permissions updated successfully");
            message.success("Permissions updated successfully");
            loadData(); // Refresh user data to show updated permissions in the table
            // Keep modal open to allow further changes? Or close?
            // closePermissionModal(); // Close after successful update
        } catch (error) {
            console.error('Error updating permissions:', error);
            message.error(error?.response?.data?.message || "Failed to update permissions");
        }
    };

    // Note: Global permission create/delete moved out of this modal for clarity
    // const createPermission = async () => { ... };
    // const deletePermission = async (permissionId) => { ... };

    // --- Table Columns (Modernized) ---
    const columns = [
        {
            title: "User",
            key: "user",
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} src={record.avatar_url} /> {/* Add avatar if available */}
                    <Space direction="vertical" size={0}>
                        <Text strong>{record.name}</Text>
                        <Text type="secondary" style={{ fontSize: '0.9em' }}>{record.email}</Text>
                    </Space>
                </Space>
            ),
        },
        // Removed Name and Email as separate columns
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            width: 150,
            align: 'center',
            render: (role, record) => {
                const roleInfo = ROLES[role] || { name: role, color: "default" };
                // Only allow changing roles if current user has permission (e.g., admin or superadmin)
                const canChangeRole = currentUser.role === 'superadmin' || (currentUser.role === 'admin' && role !== 'superadmin');

                return (
                    <Dropdown
                        disabled={!canChangeRole || record.id === currentUser.id} // Disable for self or if no permission
                        overlay={
                            <Menu onClick={({ key }) => handleRoleChange(record.id, key)}>
                                {Object.entries(ROLES)
                                    // Filter out superadmin option if current user is not superadmin
                                    .filter(([key, _]) => currentUser.role === 'superadmin' || key !== 'superadmin')
                                    .map(([key, value]) => (
                                        <Menu.Item key={key}>{value.name}</Menu.Item>
                                    ))}
                            </Menu>
                        }
                        trigger={["click"]}
                    >
                        <Tag color={roleInfo.color} style={{ cursor: canChangeRole && record.id !== currentUser.id ? 'pointer' : 'default' }}>
                            {roleInfo.name} {canChangeRole && record.id !== currentUser.id ? <DownOutlined /> : null}
                        </Tag>
                    </Dropdown>
                );
            },
        },
        {
            title: "Status",
            dataIndex: "last_seen_at",
            key: "status",
            width: 100,
            align: 'center',
            render: (lastSeen) => {
                const isOnline = isUserOnline(lastSeen);
                return (
                    <Tag color={isOnline ? "green" : "red"} style={{ margin: 0 }}>
                        {isOnline ? "Online" : "Offline"}
                    </Tag>
                );
            },
        },
        {
            title: "Permissions",
            dataIndex: "permissions",
            key: "permissions",
            width: 200,
            render: (permissions) => (
                 // Show limited tags initially, with tooltip for more
                 <Tooltip
                    title={permissions?.map(p => p.name).join(', ') || 'No permissions'}
                    placement="topLeft"
                 >
                    <Space size={[0, 4]} wrap style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                         {permissions?.slice(0, 2).map((permission) => ( // Show first 2
                             <Tag key={permission.id} color="cyan" style={{ margin: 0 }}>{permission.name}</Tag>
                         ))}
                         {permissions?.length > 2 && <Tag color="cyan">+{permissions.length - 2} more</Tag>}
                         {!permissions?.length && <Text type="secondary">None</Text>}
                     </Space>
                 </Tooltip>
            ),
        },
        {
            title: "Date Created",
            dataIndex: "created_at",
            key: "created_at",
            width: 150,
            render: (date) => moment(date).format("YYYY-MM-DD"),
            sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix(),
        },
        {
            title: "Actions",
            key: "actions",
            align: 'center',
            width: 150,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="Edit User Details">
                        <Link to={`/users/${record.id}`}>
                            <Button shape="circle" icon={<EditOutlined />} />
                        </Link>
                    </Tooltip>
                    {/* Only allow managing permissions if current user has permission */}
                     {(currentUser.role === 'superadmin' || currentUser.role === 'admin') && (
                        <Tooltip title="Manage Permissions">
                            <Button shape="circle" icon={<SafetyCertificateOutlined />} onClick={() => openPermissionModal(record)} />
                        </Tooltip>
                    )}
                     {/* Prevent user from deleting themselves */}
                    {currentUser.id !== record.id && (
                        <Tooltip title="Delete User">
                            <Button shape="circle" danger icon={<DeleteOutlined />} onClick={() => onDeleteClick(record)} />
                        </Tooltip>
                    )}
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
                        <Title level={3} style={{ margin: 0 }}>Users Management</Title>
                        <Text type="secondary">View, edit, and manage user accounts and permissions.</Text>
                    </Col>
                    <Col>
                         {/* Only show Add New if current user has permission (e.g., superadmin) */}
                        {(currentUser.role === "superadmin" || currentUser.role === "admin") && (
                            <Link to="/users/new">
                                <Button type="primary" icon={<PlusOutlined />} size="large">
                                    Add New User
                                </Button>
                            </Link>
                        )}
                    </Col>
                </Row>
            </Card>

            {/* Filter Card */}
             <Card bordered={false} style={{ marginBottom: 16 }} bodyStyle={{ paddingBottom: 0 }}>
                 <Form layout="vertical">
                     <Row gutter={[16, 0]} align="bottom">
                        {/* Keyword Search */}
                        <Col xs={24} sm={12} md={8} lg={6}>
                            <Form.Item label="Search Name/Email" style={{ marginBottom: 16 }}>
                                <Input
                                    placeholder="Search by name or email..."
                                    value={filterNameEmail}
                                    onChange={handleNameEmailFilterChange}
                                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    allowClear
                                />
                            </Form.Item>
                        </Col>
                        {/* Filter by Role */}
                         <Col xs={24} sm={12} md={6} lg={4}>
                            <Form.Item label="Filter by Role" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="All Roles"
                                    value={filterRole}
                                    onChange={handleRoleFilterChange}
                                    allowClear style={{ width: '100%' }}
                                >
                                    {Object.entries(ROLES).map(([key, value]) => (
                                        <Option key={key} value={key}>{value.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                         {/* Filter by Status */}
                         <Col xs={24} sm={12} md={6} lg={4}>
                             <Form.Item label="Filter by Status" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="Any Status"
                                    value={filterStatus}
                                    onChange={handleStatusFilterChange}
                                    allowClear style={{ width: '100%' }}
                                >
                                    <Option value="online">Online</Option>
                                    <Option value="offline">Offline</Option>
                                </Select>
                             </Form.Item>
                         </Col>
                          {/* Filter by Permission */}
                         <Col xs={24} sm={12} md={8} lg={6}>
                              <Form.Item label="Filter by Permission" style={{ marginBottom: 16 }}>
                                <Select
                                    placeholder="Has Permission..."
                                    value={filterPermission}
                                    onChange={handlePermissionFilterChange}
                                    allowClear showSearch optionFilterProp="children"
                                     filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    style={{ width: '100%' }}
                                    loading={permissionsList.length === 0 && loading}
                                >
                                    {permissionsList.map((permission) => (
                                        <Option key={permission.id} value={permission.id}>
                                            {permission.name}
                                        </Option>
                                    ))}
                                </Select>
                             </Form.Item>
                         </Col>
                         {/* Optional: Add a "Manage Global Permissions" button here if needed */}
                         {/* <Col>
                            {(currentUser.role === 'superadmin') && (
                                <Button icon={<SettingOutlined />}>Manage Global Permissions</Button>
                            )}
                         </Col> */}
                    </Row>
                </Form>
            </Card>

            {/* Users Table Card */}
            <Card bordered={false}>
                 {/* Removed fixed scroll.y, using scroll.x for responsiveness */}
                <Table
                    columns={columns}
                    dataSource={filteredUsers} // Use filtered data
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`
                    }}
                    scroll={{ x: 'max-content' }} // Enable horizontal scroll on smaller screens
                />
            </Card>

            {/* Permission Management Modal */}
            <Modal
                title={`Manage Permissions for ${selectedUser?.name || 'User'}`}
                open={isPermissionModalVisible}
                onCancel={closePermissionModal}
                footer={[ // Custom footer
                    <Button key="back" onClick={closePermissionModal}>
                        Close
                    </Button>,
                    // Save button is implicit via onChange in Select for simplicity,
                    // or add an explicit Save button if preferred:
                    // <Button key="submit" type="primary" onClick={() => handlePermissionChange(currentSelection)}>
                    //   Save Permissions
                    // </Button>
                ]}
                destroyOnClose
                maskClosable={false}
                width={600}
            >
                {/* Removed global permission creation from here */}
                <Divider orientation="left" plain>Assign Permissions</Divider>
                <Select
                    mode="multiple"
                    allowClear
                    style={{ width: "100%" }}
                    placeholder="Select permissions for this user"
                     // Use controlled component approach if needed, otherwise defaultValue works for initial load
                    defaultValue={selectedUser?.permissions?.map((p) => p.id)}
                    onChange={handlePermissionChange} // Update permissions immediately on change
                    loading={permissionsList.length === 0 && loading}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                        option.children.toLowerCase().includes(input.toLowerCase())
                    }
                >
                    {permissionsList.map((permission) => (
                        <Option key={permission.id} value={permission.id}>
                            {permission.name}
                            {/* Removed global delete button from here */}
                        </Option>
                    ))}
                </Select>
                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                    Select all the permissions this user should have. Changes are saved automatically.
                </Text>
            </Modal>
        </div>
    );
}