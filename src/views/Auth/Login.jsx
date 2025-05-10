import { Link, useNavigate } from "react-router-dom";
import axiosClient from "../../services/axios-client.js";
import { useStateContext } from "../../context/ContextProvider.jsx";
import { useState, useEffect } from "react";
import {
    Form,
    Input,
    Button,
    Alert,
    Divider,
    Typography,
    Row,
    Col,
    Card,
    Layout,
    Space,
} from "antd";
import { GoogleOutlined, MailOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";

// Import useRef for video element interaction if needed later (e.g., play/pause controls)
import { useRef } from 'react';

const { Title, Text } = Typography;
const { Content } = Layout;

// Theme colors (kept for Card styling)
const themeColors = {
    primary: '#1890ff',
    cardBackground: 'rgba(255, 255, 255, 0.9)', // Slightly transparent white for readability over video
    // cardBackground: '#ffffff', // Or keep it solid white
    textColor: 'rgba(0, 0, 0, 0.88)', // Updated text color for antd v5+
    textColorSecondary: 'rgba(0, 0, 0, 0.45)',
};

// Styles for layering
const styles = {
    // Container for the whole page, allows positioning video behind
    pageContainer: {
        position: 'relative', // Context for absolute/fixed positioning
        minHeight: '100vh',
        overflow: 'hidden', // Hide potential video overflow
    },
    // Video container styles
    videoContainer: {
        position: 'fixed', // Fixed position to stay in background
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // Place it behind everything else
        overflow: 'hidden', // Ensure video doesn't cause scrollbars
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover', // Cover the container without distortion
    },
    // Ant Design Layout needs to be transparent to see video
    layout: {
        minHeight: "100vh",
        background: 'transparent', // Make Layout transparent
        position: 'relative', // Ensure it sits above z-index -1
        zIndex: 1, // Explicitly above video
    },
    // Card styles (including the fix for bodyStyle)
    card: {
        background: themeColors.cardBackground,
        borderRadius: '16px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.2)', // Slightly stronger shadow for contrast
        // padding is now handled by styles.body below
    },
    // Correct way to style Card body in Antd v5+
    cardBody: {
        padding: '24px 32px',
    }
};

export default function Login() {
    const { setUser, setToken } = useStateContext();
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    // Optional: Ref for video element if you need to control it
    const videoRef = useRef(null);

    // onSubmit and onGoogleLogin remain the same as the previous modern version
    const onSubmit = (values) => {
        setMessage(null);
        setLoading(true);
        const payload = {
            email: values.email,
            password: values.password,
        };
        axiosClient
            .post("/login", payload)
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);
            })
            .catch((err) => {
                const response = err.response;
                if (response && response.status === 422) {
                    setMessage(response.data.message || "Invalid credentials.");
                } else if (response && response.data && response.data.message) {
                    setMessage(response.data.message);
                } else {
                    setMessage("Login failed. Please check your connection and try again.");
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const onGoogleLogin = () => {
        setGoogleLoading(true);
        setMessage(null);
        const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        window.location.href = `${backendUrl}/auth/google`;
    };

    // useEffect remains the same as the previous modern version
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const tokenFromUrl = queryParams.get("token");
        const errorFromUrl = queryParams.get("error");
        const existingToken = localStorage.getItem('ACCESS_TOKEN');

        if (tokenFromUrl || errorFromUrl) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        if (errorFromUrl) {
            setMessage(decodeURIComponent(errorFromUrl));
            setGoogleLoading(false);
            return;
        }

        const tokenToUse = tokenFromUrl || existingToken;

        if (tokenToUse) {
             let isProcessingToken = true;
             if (tokenFromUrl && tokenFromUrl !== existingToken) {
                setToken(tokenFromUrl);
            }
            setLoading(true);
             axiosClient
                .get("/user")
                .then(({ data }) => {
                    setUser(data);
                    navigate("/dashboard");
                })
                .catch((err) => {
                    console.error("Token verification/User fetch failed:", err);
                    setMessage("Session invalid or expired. Please log in.");
                    setToken(null);
                })
                .finally(() => {
                     setLoading(false);
                     setGoogleLoading(false);
                     isProcessingToken = false;
                 });
        } else {
            setLoading(false);
            setGoogleLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [navigate, setToken, setUser]);


    return (
        <div style={styles.pageContainer}>
            {/* Video Background Layer */}
            <div style={styles.videoContainer}>
                <video
                    ref={videoRef} // Assign ref if needed
                    autoPlay
                    loop
                    muted
                    playsInline // Important for mobile browsers
                    style={styles.video}
                >
                    {/* Ensure vd.mp4 is in your public folder */}
                    <source src="/vd.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                 {/* Optional Overlay for better text readability */}
                 {/* <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', zIndex: 0}}></div> */}
            </div>

            {/* Content Layer (Ant Design Layout) */}
            <Layout style={styles.layout}>
                <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent' }}> {/* Ensure Content is also transparent */}
                    <Row justify="center" align="middle" style={{ width: '100%' }}>
                        <Col xs={22} sm={18} md={12} lg={8} xl={7}>
                            {/* Use the corrected 'styles' prop instead of 'bodyStyle' */}
                            <Card
                                bordered={false}
                                style={styles.card} // Apply card styles
                                styles={{ body: styles.cardBody }} // Pass body styles via the 'styles' prop
                            >
                                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                                    <Title level={2} style={{ color: themeColors.textColor, marginBottom: 8 }}>
                                        Welcome Back!
                                    </Title>
                                    <Text style={{ color: themeColors.textColorSecondary }}>
                                        Sign in to access your account
                                    </Text>
                                </div>

                                {message && (
                                    <Alert
                                        message={message}
                                        type="error"
                                        showIcon
                                        closable
                                        onClose={() => setMessage(null)}
                                        style={{ marginBottom: 24, borderRadius: '8px' }}
                                    />
                                )}

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
                                            { type: "email", message: "Please enter a valid email" },
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined style={{ color: themeColors.textColorSecondary }} />}
                                            placeholder="Email Address"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="password"
                                        rules={[{ required: true, message: "Please enter your password" }]}
                                    >
                                        <Input.Password
                                            prefix={<LockOutlined style={{ color: themeColors.textColorSecondary }} />}
                                            placeholder="Password"
                                            style={{ borderRadius: '8px' }}
                                        />
                                    </Form.Item>

                                    <Row justify="end" style={{ marginBottom: '16px' }}>
                                        <Link to="/forgot-password" style={{ color: themeColors.primary }}>
                                            <Text style={{ color: 'inherit', fontSize: '0.9em' }}>Forgot Password?</Text>
                                        </Link>
                                    </Row>

                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            block
                                            loading={loading}
                                            icon={<LoginOutlined />}
                                            style={{ borderRadius: '8px', height: '45px', fontWeight: 500 }}
                                        >
                                            Login
                                        </Button>
                                    </Form.Item>
                                </Form>

                                <Divider style={{ margin: '24px 0' }}>
                                    <Text style={{ color: themeColors.textColorSecondary, fontSize: '0.9em' }}>
                                        Or continue with
                                    </Text>
                                </Divider>

                                <Button
                                    icon={<GoogleOutlined />}
                                    block
                                    size="large"
                                    onClick={onGoogleLogin}
                                    loading={googleLoading}
                                    style={{
                                        marginBottom: 24,
                                        borderRadius: '8px',
                                        height: '45px',
                                        fontWeight: 500
                                    }}
                                >
                                    Sign in with Google
                                </Button>

                                <Text style={{ textAlign: "center", display: "block", color: themeColors.textColorSecondary }}>
                                    Don't have an account?{' '}
                                    <Link to="/signup" style={{ color: themeColors.primary, fontWeight: 500 }}>
                                        Sign Up Now
                                    </Link>
                                </Text>
                            </Card>
                        </Col>
                    </Row>
                </Content>
            </Layout>
        </div>
    );
}