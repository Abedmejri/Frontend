import { useNavigate, useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../../services/axios-client.js";
import { useStateContext } from "../../context/ContextProvider.jsx";
import {
    Form, Input, Button, Typography, Spin, message, Select, Checkbox,
    Card, Row, Col, Space, Alert, Divider, Avatar // Added Avatar
} from "antd";
import {
    UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined,
    ArrowLeftOutlined, SafetyCertificateOutlined, IdcardOutlined // Added IdcardOutlined
} from '@ant-design/icons';
import moment from "moment"; // Useful for displaying created_at/updated_at if needed

const { Title, Text } = Typography;
const { Option } = Select; // Correct way to get Option

// Define roles for consistency and easy mapping
const ROLES = {
    user: { label: "User", value: "user" },
    admin: { label: "Admin", value: "admin" },
    superadmin: { label: "Super Admin", value: "superadmin" },
};

// Helper to get initials for Avatar
const getInitials = (name = '') => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

export default function UserForm() {
    const navigate = useNavigate();
    let { id } = useParams();
    const isEditing = !!id;

    // State Management
    const [userData, setUserData] = useState(null); // Store fetched user data for display
    const [permissionsList, setPermissionsList] = useState([]);
    const [apiErrors, setApiErrors] = useState(null);
    const [loading, setLoading] = useState(isEditing);
    const [permissionsLoading, setPermissionsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const { setNotification, user: currentUser } = useStateContext(); // Get current logged-in user
    const [form] = Form.useForm();

    // --- Fetch Data ---
    useEffect(() => {
        // Fetch Permissions (runs once)
        setPermissionsLoading(true);
        axiosClient.get("/permissions")
            .then(({ data }) => {
                setPermissionsList(data || []);
            })
            .catch((err) => {
                console.error("Failed to fetch permissions:", err);
                message.error("Failed to load permissions list.");
            })
            .finally(() => setPermissionsLoading(false));

        // Fetch User Data (only if editing)
        if (isEditing) {
            setLoading(true);
            axiosClient.get(`/users/${id}`)
                .then(({ data }) => {
                    setUserData(data); // Store fetched data
                    // Explicitly set form values - critical for Select components
                    form.setFieldsValue({
                        name: data.name,
                        email: data.email,
                        role: data.role, // Ensure this value matches one of the Option values ('user', 'admin', 'superadmin')
                        permissions: data.permissions?.map((p) => p.id) || [],
                        password: '', // Always clear password fields on load for edit
                        password_confirmation: '',
                    });
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("Failed to fetch user:", err);
                    message.error(`Failed to load user data (ID: ${id}).`);
                    setLoading(false);
                    navigate('/users'); // Redirect on error
                });
        } else {
             // Set default role for new user form
            form.setFieldsValue({ role: ROLES.user.value, permissions: [] });
            setLoading(false);
        }
    }, [id, form, isEditing, navigate]); // Dependencies

    // --- Form Submission ---
    const onSubmit = (values) => {
        setSubmitting(true);
        setApiErrors(null);

        const payload = { ...values };
        if (isEditing && !payload.password) {
            delete payload.password;
            delete payload.password_confirmation;
        }

        // Prevent non-superadmins from setting superadmin role
        if (currentUser?.role !== ROLES.superadmin.value && payload.role === ROLES.superadmin.value) {
             message.error("You do not have permission to assign the Super Admin role.");
             setSubmitting(false);
             // Optionally reset the role field back if needed
             // form.setFieldsValue({ role: userData?.role || ROLES.user.value });
             return;
        }

        const apiCall = isEditing
            ? axiosClient.put(`/users/${id}`, payload)
            : axiosClient.post("/users", payload);

        apiCall
            .then(() => {
                const successMessage = `User was successfully ${isEditing ? 'updated' : 'created'}`;
                setNotification(successMessage);
                message.success(successMessage);
                navigate("/users");
            })
            .catch((err) => {
                const response = err.response;
                if (response && response.status === 422) {
                    const errors = response.data.errors;
                    setApiErrors(errors);
                    const errorFields = Object.keys(errors).map((key) => ({
                        name: key, errors: errors[key],
                    }));
                    form.setFields(errorFields);
                    message.error("Please check the form for validation errors.");
                } else {
                    console.error("Form submission error:", err);
                    const generalError = err?.response?.data?.message || err.message || "An unexpected error occurred.";
                    setApiErrors({ general: [generalError] });
                    message.error(generalError);
                }
            })
            .finally(() => {
                setSubmitting(false);
            });
    };

    // --- Render ---
    return (
        <div style={{ padding: "24px", maxWidth: '900px', margin: '0 auto' }}> {/* Center content */}
            <Card bordered={false} loading={loading}>
                {/* Card Header */}
                <Row justify="space-between" align="center" style={{ marginBottom: '24px' }}>
                    <Col>
                        <Space align="center" size="middle">
                             <Link to="/users">
                                <Button type="text" shape="circle" icon={<ArrowLeftOutlined />} size="large" />
                            </Link>
                             {isEditing && userData?.avatar_url ? (
                                <Avatar size={48} src={userData.avatar_url} />
                             ) : (
                                <Avatar size={48} style={{ backgroundColor: '#87d068' }}>
                                    {getInitials(isEditing ? userData?.name : 'N U')}
                                </Avatar>
                             )}
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {isEditing ? `Edit User: ${userData?.name || ''}` : "Create New User"}
                                </Title>
                                <Text type="secondary">Manage user details, role, and permissions.</Text>
                            </div>
                        </Space>
                    </Col>
                     {/* Maybe add created/updated dates here if useful */}
                    {/* {isEditing && userData && (
                        <Col>
                            <Text type="secondary" style={{ fontSize: '0.85em' }}>
                                Created: {moment(userData.created_at).format('YYYY-MM-DD')}<br/>
                                Updated: {moment(userData.updated_at).fromNow()}
                            </Text>
                        </Col>
                    )} */}
                </Row>

                {/* Display General API Errors */}
                 {apiErrors?.general && (
                    <Alert message="Error" description={apiErrors.general.join(' ')} type="error" showIcon style={{ marginBottom: 16 }}/>
                )}

                <Form form={form} onFinish={onSubmit} layout="vertical" requiredMark="optional">
                    <Divider orientation="left" plain>Basic Information</Divider>
                    <Row gutter={[24, 0]}> {/* Responsive gutter */}
                        <Col xs={24} md={12}>
                            <Form.Item label="Full Name" name="name" rules={[{ required: true }]} hasFeedback>
                                <Input prefix={<UserOutlined />} placeholder="Enter user's full name" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Email Address" name="email" rules={[{ required: true }, { type: 'email' }]} hasFeedback>
                                <Input prefix={<MailOutlined />} placeholder="Enter email address" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" plain>Password {isEditing && '(Leave blank to keep unchanged)'}</Divider>
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Password" name="password" rules={[{ required: !isEditing }, { min: 6, transform: value => value || '' }]} hasFeedback>
                                <Input.Password prefix={<LockOutlined />} placeholder={isEditing ? "New password (optional)" : "Enter password"} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={12}>
                            <Form.Item label="Confirm Password" name="password_confirmation" dependencies={["password"]} rules={[({ getFieldValue }) => ({ required: !isEditing || !!getFieldValue('password'), message: 'Please confirm password' }), ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('Passwords do not match!')); } })]} hasFeedback>
                                <Input.Password prefix={<LockOutlined />} placeholder={isEditing ? "Confirm new password" : "Confirm password"} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider orientation="left" plain>Role & Permissions</Divider>
                    <Row gutter={[24, 16]}> {/* Add vertical gutter */}
                        <Col xs={24} md={8}>
                            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
                                <Select
                                    placeholder="Select user role"
                                    // Disable superadmin option if current user is not superadmin
                                    disabled={isEditing && userData?.id === currentUser?.id && currentUser?.role === ROLES.superadmin.value} // Prevent superadmin self-demotion
                                >
                                    {Object.values(ROLES).map(role => (
                                        <Option
                                            key={role.value}
                                            value={role.value}
                                            disabled={role.value === ROLES.superadmin.value && currentUser?.role !== ROLES.superadmin.value}
                                        >
                                            {role.label}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col xs={24} md={16}>
                            <Form.Item label="Permissions" name="permissions" tooltip="Grant specific abilities to this user.">
                                <Select
                                    mode="multiple"
                                    allowClear
                                    style={{ width: '100%' }}
                                    placeholder="Select permissions..."
                                    loading={permissionsLoading}
                                    optionFilterProp="children" // Allows searching by permission name
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {permissionsList.map(permission => (
                                        <Option key={permission.id} value={permission.id}>
                                            {permission.name}
                                        </Option>
                                    ))}
                                </Select>
                                {permissionsList.length === 0 && !permissionsLoading && <Text type="secondary">No permissions available to assign.</Text>}
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider />

                    {/* Submit/Cancel Buttons */}
                    <Form.Item style={{ textAlign: 'right', marginTop: '24px', marginBottom: 0 }}>
                        <Space size="middle">
                            <Button onClick={() => navigate('/users')}>
                                Cancel
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
                                {isEditing ? "Update User" : "Create User"}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}