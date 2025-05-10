import { useState } from "react";
import {
    Form,
    Input,
    Button,
    Alert,
    Typography,
    Row,
    Col,
    Card,
    Layout, // Import Layout
    Space, // Import Space if needed
} from "antd";
import { MailOutlined, SendOutlined } from "@ant-design/icons"; // Added SendOutlined
import axiosClient from "../../services/axios-client.js";
import { Link } from "react-router-dom";
// Removed: import "./ForgotPassword.css";

const { Title, Text } = Typography;
const { Content } = Layout;

// Optional: Define theme colors for consistency
const themeColors = {
    primary: '#1890ff',
    cardBackground: '#ffffff',
    textColor: 'rgba(0, 0, 0, 0.88)',
    textColorSecondary: 'rgba(0, 0, 0, 0.45)',
    layoutBackground: '#f0f2f5', // Light grey background
};

// Styles object for cleaner inline styling
const styles = {
    layout: {
        minHeight: "100vh",
        background: themeColors.layoutBackground, // Apply background color
    },
    card: {
        background: themeColors.cardBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)', // Adjusted shadow
        maxWidth: '450px', // Max width for the card on larger screens
        width: '100%', // Ensure it takes col width
    },
    // Correct way to style Card body in Antd v5+
    cardBody: {
        padding: '32px 40px', // Generous padding
    }
};

export default function ForgotPassword() {
    const [message, setMessage] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false); // Track if the message is success
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const onSubmit = (values) => {
        setLoading(true);
        setMessage(null); // Clear previous message
        setIsSuccess(false);
        axiosClient
            .post("/forgot-password", { email: values.email })
            .then((response) => {
                // Use a clear success message from backend if available, or fallback
                setMessage(response?.data?.message || "Password reset link sent successfully to your email.");
                setIsSuccess(true);
                form.resetFields(); // Clear form on success
            })
            .catch((err) => {
                const response = err.response;
                let errorMessage = "An error occurred. Please try again.";
                if (response && response.data && response.data.message) {
                    errorMessage = response.data.message; // Use backend message
                } else if (response && response.status === 422 && response.data?.errors?.email) {
                    // Handle specific validation errors if needed
                    errorMessage = response.data.errors.email[0];
                }
                 setMessage(errorMessage);
                 setIsSuccess(false);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Layout style={styles.layout}>
            <Content>
                <Row
                    justify="center"
                    align="middle"
                    style={{ minHeight: "calc(100vh - 64px)" }} // Adjust height if you have a header/footer
                >
                    <Col> {/* Let Col shrink to Card size */}
                        <Card
                            bordered={false}
                            style={styles.card}
                            styles={{ body: styles.cardBody }} // Use styles prop
                        >
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <Title level={3} style={{ color: themeColors.textColor, marginBottom: 8 }}>
                                    Forgot Your Password?
                                </Title>
                                <Text style={{ color: themeColors.textColorSecondary }}>
                                    No worries! Enter your email below and we'll send you a reset link.
                                </Text>
                            </div>

                            {message && (
                                <Alert
                                    message={message}
                                    type={isSuccess ? "success" : "error"}
                                    showIcon
                                    closable
                                    onClose={() => setMessage(null)} // Allow closing the message
                                    style={{ marginBottom: 24, borderRadius: '8px' }}
                                />
                            )}

                            {/* Hide form after successful submission */}
                            {!isSuccess && (
                                <Form
                                    form={form}
                                    onFinish={onSubmit}
                                    layout="vertical"
                                    size="large"
                                >
                                    <Form.Item
                                        name="email"
                                        rules={[
                                            { required: true, message: "Please enter your email address" },
                                            { type: "email", message: "Please enter a valid email format" },
                                        ]}
                                        validateTrigger="onBlur" // Validate on blur for better UX
                                    >
                                        <Input
                                            prefix={<MailOutlined style={{ color: themeColors.textColorSecondary }} />}
                                            placeholder="Enter your registered email"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>

                                    <Form.Item style={{ marginTop: '16px' }}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            icon={<SendOutlined />} // Add icon
                                            style={{ borderRadius: '8px', height: '45px', fontWeight: 500 }}
                                        >
                                            Send Reset Link
                                        </Button>
                                    </Form.Item>
                                </Form>
                            )}

                            <Text style={{ textAlign: "center", display: "block", marginTop: 20, color: themeColors.textColorSecondary }}>
                                Remembered your password?{' '}
                                <Link to="/login" style={{ color: themeColors.primary, fontWeight: 500 }}>
                                    Back to Login
                                </Link>
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}