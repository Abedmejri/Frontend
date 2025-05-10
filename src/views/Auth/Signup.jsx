import { Link, useNavigate } from "react-router-dom"; // Added useNavigate
import axiosClient from "../../services/axios-client.js";
import { useStateContext } from "../../context/ContextProvider.jsx";
import { useState, useEffect } from "react"; // Added useEffect
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
    Layout, // Import Layout
    Space, // Import Space
    message as antdMessage // Import Ant Design message for feedback
} from "antd";
import { UserOutlined, MailOutlined, LockOutlined, CheckCircleOutlined } from "@ant-design/icons"; // Added icons
// Removed: import "./Signup.css";

const { Title, Text } = Typography;
const { Content } = Layout;

// Consistent theme colors
const themeColors = {
    primary: '#1890ff',
    cardBackground: '#ffffff',
    textColor: 'rgba(0, 0, 0, 0.88)',
    textColorSecondary: 'rgba(0, 0, 0, 0.45)',
    layoutBackground: '#f0f2f5',
};

// Consistent styles object
const styles = {
    layout: {
        minHeight: "100vh",
        background: themeColors.layoutBackground,
    },
    card: {
        background: themeColors.cardBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px', // Slightly wider for signup form
        width: '100%',
    },
    cardBody: {
        padding: '32px 40px', // Consistent padding
    }
};

export default function Signup() {
    const { setUser, setToken, token } = useStateContext(); // Get token to redirect if already logged in
    const [validationErrors, setValidationErrors] = useState(null); // Specifically for 422 errors
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();

    // Redirect if user is already logged in
    useEffect(() => {
        if (token) {
            navigate('/dashboard'); // Or your desired authenticated route
        }
    }, [token, navigate]);

    const onSubmit = (values) => {
        setLoading(true);
        setValidationErrors(null); // Clear previous validation errors
        const payload = {
            name: values.name,
            email: values.email,
            password: values.password,
            password_confirmation: values.passwordConfirmation,
        };

        axiosClient
            .post("/signup", payload)
            .then(({ data }) => {
                setUser(data.user);
                setToken(data.token);
                antdMessage.success('Signup successful! Redirecting...');
                // No need to navigate here, the useEffect watching the token will handle it
            })
            .catch((err) => {
                const response = err.response;
                if (response && response.status === 422) {
                    // Set validation errors for the Alert component
                    setValidationErrors(response.data.errors);
                    antdMessage.error('Please check the form for errors.');
                } else {
                    // Handle other errors (network, server error, etc.)
                    console.error("Signup error:", err); // Log the full error
                    antdMessage.error(response?.data?.message || 'An unexpected error occurred during signup. Please try again.');
                    setValidationErrors(null); // Ensure validation error display is cleared
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Function to render validation errors in the Alert
    const renderErrors = (errors) => {
        if (!errors) return null;
        return (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
                {Object.keys(errors).map((key) => (
                    // Ensure errors[key] is an array and has at least one message
                    Array.isArray(errors[key]) && errors[key].length > 0
                        ? <li key={key}>{errors[key][0]}</li> // Display first message for the key
                        : null // Handle cases where errors[key] might not be as expected
                ))}
            </ul>
        );
    };


    return (
        <Layout style={styles.layout}>
            <Content>
                <Row
                    justify="center"
                    align="middle"
                    style={{ minHeight: "calc(100vh - 64px)", padding: '20px 0' }} // Add vertical padding
                >
                    <Col> {/* Let Col shrink to Card size */}
                        <Card
                            bordered={false}
                            style={styles.card}
                            styles={{ body: styles.cardBody }} // Use styles prop
                        >
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <Title level={3} style={{ color: themeColors.textColor, marginBottom: 8 }}>
                                    Create Your Account
                                </Title>
                                <Text style={{ color: themeColors.textColorSecondary }}>
                                    Join us! It's quick and easy.
                                </Text>
                            </div>

                            {validationErrors && (
                                <Alert
                                    message="Signup Failed"
                                    description={renderErrors(validationErrors)}
                                    type="error"
                                    showIcon
                                    closable
                                    onClose={() => setValidationErrors(null)} // Allow closing
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
                                    name="name"
                                    rules={[
                                        { required: true, message: "Please enter your full name" },
                                        { whitespace: true, message: "Name cannot be empty" },
                                        { min: 3, message: "Name must be at least 3 characters" }
                                    ]}
                                    validateTrigger="onBlur"
                                >
                                    <Input
                                        prefix={<UserOutlined style={{ color: themeColors.textColorSecondary }} />}
                                        placeholder="Full Name"
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: "Please enter your email address" },
                                        { type: "email", message: "Please enter a valid email format" },
                                    ]}
                                    validateTrigger="onBlur"
                                >
                                    <Input
                                        prefix={<MailOutlined style={{ color: themeColors.textColorSecondary }} />}
                                        placeholder="Email Address"
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="password"
                                    rules={[
                                        { required: true, message: "Please create a password" },
                                        { min: 8, message: "Password must be at least 8 characters" }
                                        // Add more complex password rules if needed
                                        // { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, message: "Password must include letters and numbers" }
                                    ]}
                                    hasFeedback // Shows validating/success icons
                                    validateTrigger="onBlur"
                                >
                                    <Input.Password
                                        prefix={<LockOutlined style={{ color: themeColors.textColorSecondary }} />}
                                        placeholder="Create Password (min. 8 characters)"
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="passwordConfirmation"
                                    dependencies={["password"]} // Ensures re-validation when password changes
                                    rules={[
                                        { required: true, message: "Please confirm your password" },
                                        // Custom validator function
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) {
                                                    return Promise.resolve(); // Passwords match or field is empty
                                                }
                                                return Promise.reject(new Error('The two passwords do not match!'));
                                            },
                                        }),
                                    ]}
                                    hasFeedback // Shows validating/success icons
                                    validateTrigger="onBlur"
                                >
                                    <Input.Password
                                        prefix={<CheckCircleOutlined style={{ color: themeColors.textColorSecondary }} />} // Different icon for confirmation
                                        placeholder="Confirm Password"
                                        style={{ borderRadius: '8px' }}
                                    />
                                </Form.Item>

                                <Form.Item style={{ marginTop: '16px' }}>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        block
                                        loading={loading}
                                        // icon={<UserOutlined />} // Or another relevant icon
                                        style={{ borderRadius: '8px', height: '45px', fontWeight: 500 }}
                                    >
                                        Create Account
                                    </Button>
                                </Form.Item>
                            </Form>

                             {/* Keep Divider simple or remove if preferred */}
                             {/* <Divider style={{ margin: '20px 0' }} /> */}

                            <Text style={{ textAlign: "center", display: "block", marginTop: 20, color: themeColors.textColorSecondary }}>
                                Already have an account?{' '}
                                <Link to="/login" style={{ color: themeColors.primary, fontWeight: 500 }}>
                                    Sign In Here
                                </Link>
                            </Text>
                        </Card>
                    </Col>
                </Row>
            </Content>
        </Layout>
    );
}