import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
    Form,
    Input,
    Button,
    Alert,
    Typography,
    Row,
    Col,
    Card,
    Layout,
    Spin, // Import Spin for loading indication
    message, // Import message for feedback
} from "antd";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axiosClient from "../../services/axios-client.js"; // Adjust path if needed

const { Title, Text } = Typography;
const { Content } = Layout;

// Reusing styles from ForgotPassword - adjust if needed
const themeColors = {
    primary: '#1890ff',
    cardBackground: '#ffffff',
    textColor: 'rgba(0, 0, 0, 0.88)',
    textColorSecondary: 'rgba(0, 0, 0, 0.45)',
    layoutBackground: '#f0f2f5',
};

const styles = {
    layout: {
        minHeight: "100vh",
        background: themeColors.layoutBackground,
    },
    card: {
        background: themeColors.cardBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        maxWidth: '450px',
        width: '100%',
    },
    cardBody: {
        padding: '32px 40px',
    }
};

export default function ResetPassword() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // General error message
    const [success, setSuccess] = useState(false);

    // Get token from URL path and email from query string
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');

    const navigate = useNavigate(); // Hook for navigation

    // Pre-fill email if available (optional, but good UX)
    useEffect(() => {
        if (email) {
            form.setFieldsValue({ email: email });
        }
         // Basic validation: check if token and email are present
        if (!token || !email) {
            setError("Invalid password reset link. Please request a new one.");
            setLoading(false); // Ensure loading is off
        }
    }, [email, token, form]);


    const onFinish = (values) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Ensure token and email are included in the payload
        const payload = {
            token: token,
            email: values.email, // Get email from form values
            password: values.password,
            password_confirmation: values.password_confirmation,
        };

        axiosClient
            .post("/reset-password", payload) // Ensure this matches your Laravel API route
            .then((response) => {
                setSuccess(true);
                message.success(response?.data?.message || "Password reset successfully!");
                form.resetFields();
                // Optionally redirect to login after a delay
                setTimeout(() => {
                    navigate("/login"); // Adjust login route if needed
                }, 3000); // Redirect after 3 seconds
            })
            .catch((err) => {
                const response = err.response;
                if (response && response.status === 422) {
                    // Handle validation errors - Antd form should display them automatically
                    // based on backend response structure { message: "...", errors: { field: [...] } }
                    setError(response.data.message || "Validation failed. Please check the fields.");
                    // You might need specific logic here if backend validation response is different
                     // or set field errors manually if needed: form.setFields([{ name: 'password', errors: ['Error message'] }])
                } else if (response && response.data && response.data.message) {
                    setError(response.data.message); // e.g., "Invalid token" or other backend error
                } else {
                    setError("An unexpected error occurred. Please try again.");
                }
                setSuccess(false);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // If link is invalid from the start
    if (!token || !email && !error) {
         return (
             <Layout style={styles.layout}>
                 <Content>
                     <Row justify="center" align="middle" style={{ minHeight: "calc(100vh - 64px)" }}>
                         <Col>
                            <Spin spinning={true} tip="Verifying link...">
                                {/* Optional: Add a placeholder card while verifying */}
                            </Spin>
                         </Col>
                     </Row>
                 </Content>
             </Layout>
         );
     }


    return (
        <Layout style={styles.layout}>
            <Content>
                <Row
                    justify="center"
                    align="middle"
                    style={{ minHeight: "calc(100vh - 64px)" }}
                >
                    <Col>
                        <Card
                            bordered={false}
                            style={styles.card}
                            styles={{ body: styles.cardBody }}
                        >
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <Title level={3} style={{ color: themeColors.textColor, marginBottom: 8 }}>
                                    Set New Password
                                </Title>
                                {!success && (
                                    <Text style={{ color: themeColors.textColorSecondary }}>
                                        Create a new strong password for your account.
                                    </Text>
                                )}
                            </div>

                            {/* Display general error messages */}
                            {error && !success && (
                                <Alert
                                    message={error}
                                    type="error"
                                    showIcon
                                    closable
                                    onClose={() => setError(null)}
                                    style={{ marginBottom: 24, borderRadius: '8px' }}
                                />
                            )}

                            {success && (
                                <Alert
                                    message="Password Reset Successful!"
                                    description="Your password has been updated. You will be redirected to login shortly."
                                    type="success"
                                    showIcon
                                    icon={<CheckCircleOutlined />}
                                    style={{ marginBottom: 24, borderRadius: '8px' }}
                                />
                            )}

                            {/* Hide form on success */}
                            {!success && (
                                <Form
                                    form={form}
                                    onFinish={onFinish}
                                    layout="vertical"
                                    size="large"
                                    disabled={loading || !token || !email} // Disable form if link is invalid or loading
                                >
                                     {/* Email Field (read-only or hidden) */}
                                    <Form.Item
                                        label="Email Address"
                                        name="email"
                                        rules={[{ required: true }]} // Keep required rule for submission logic
                                    >
                                        <Input readOnly style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', borderRadius: '8px' }} />
                                    </Form.Item>


                                    <Form.Item
                                        label="New Password"
                                        name="password"
                                        rules={[
                                            { required: true, message: "Please enter your new password" },
                                            // Add more rules if needed (e.g., min length) matching Laravel's rules
                                            { min: 8, message: "Password must be at least 8 characters" },
                                        ]}
                                        hasFeedback // Shows validation icons
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined style={{ color: themeColors.textColorSecondary }} />}
                                            placeholder="Enter new password"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Confirm New Password"
                                        name="password_confirmation"
                                        dependencies={['password']} // Depends on the password field
                                        hasFeedback
                                        rules={[
                                            { required: true, message: "Please confirm your new password" },
                                            // Validator function to check if passwords match
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    if (!value || getFieldValue('password') === value) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('The two passwords that you entered do not match!'));
                                                },
                                            }),
                                        ]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined style={{ color: themeColors.textColorSecondary }} />}
                                            placeholder="Confirm new password"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{ marginTop: '16px' }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            style={{ borderRadius: '8px', height: '45px', fontWeight: 500 }}
                                            disabled={loading || !token || !email} // Also disable button if link invalid
                                        >
                                            Reset Password
                                        </Button>
                                    </Form.Item>
                                </Form>
                            )}

                           {/* Link to login only shown if not successful yet */}
                            {!success && (
                                <Text style={{ textAlign: "center", display: "block", marginTop: 20, color: themeColors.textColorSecondary }}>
                                    Remembered your password?{' '}
                                    <Link to="/login" style={{ color: themeColors.primary, fontWeight: 500 }}>
                                        Back to Login
                                    </Link>
                                </Text>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}