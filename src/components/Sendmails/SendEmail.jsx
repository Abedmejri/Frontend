import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Space,
  Upload,
  Divider,
  Tooltip, // Import Tooltip
} from 'antd';

import {
  MailOutlined,
  UserOutlined,
  TeamOutlined,
  SendOutlined,
  PaperClipOutlined,
  UploadOutlined,
  InboxOutlined,
  UsergroupAddOutlined, // Added icon for the new button
} from '@ant-design/icons';

import axiosClient from '../../services/axios-client'; // Adjust path if needed

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload; // Destructure Dragger

const MAX_FILE_SIZE_MB = 10; // Max file size per file in MB
const MAX_TOTAL_SIZE_MB = 25; // Max total attachment size in MB

export default function SendEmail() {
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]); // All available users for manual selection
  const [commissions, setCommissions] = useState([]); // All commissions with their data
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [sending, setSending] = useState(false);
  const [fileList, setFileList] = useState([]);
  // State to hold the full object of the currently selected commission
  const [selectedCommissionObject, setSelectedCommissionObject] = useState(null);

  // Fetch Users & Commissions
  useEffect(() => {
    const fetchData = async () => {
      setLoadingUsers(true);
      setLoadingCommissions(true);
      try {
        const [usersResponse, commissionsResponse] = await Promise.all([
          axiosClient.get('/users'), // Fetches all users for the manual selector
          axiosClient.get('/commissions?include=members'), // IMPORTANT: Ensure API supports fetching members E.g., /commissions?include=members
        ]);

        setUsers(usersResponse.data?.data || usersResponse.data || []); // Adjust based on your user API structure

        // Ensure members array exists for each commission
        const processedCommissions = (commissionsResponse.data?.data || commissionsResponse.data || []).map(c => ({
             ...c,
             members: Array.isArray(c.members) ? c.members : [] // Ensure members is always an array
        }));
        setCommissions(processedCommissions);

      } catch (error) {
        console.error("Failed to load data:", error);
        message.error('Failed to load users or commissions. Please ensure the API endpoint for commissions includes member data.');
      } finally {
        setLoadingUsers(false);
        setLoadingCommissions(false);
      }
    };
    fetchData();
  }, []);

  // --- Commission Selection Handler ---
  const handleCommissionChange = (commissionId) => {
    // Find the full commission object based on the selected ID
    const commissionObj = commissions.find(c => c.id === commissionId);
    setSelectedCommissionObject(commissionObj || null);
    // Also update the form field value for submission
    form.setFieldsValue({ selectedCommission: commissionId });
  };

  // --- Add Commission Members Handler ---
  const handleAddCommissionMembers = () => {
    if (!selectedCommissionObject || !selectedCommissionObject.members || selectedCommissionObject.members.length === 0) {
      message.info('Selected commission has no members to add.');
      return;
    }

    // Get the IDs of the members from the selected commission
    const memberIdsToAdd = selectedCommissionObject.members.map(member => member.id);

    // Get the currently selected user IDs from the form field
    const currentSelectedUserIds = form.getFieldValue('selectedUsers') || [];

    // Combine the current list with the new member IDs, removing duplicates
    const combinedIds = [...new Set([...currentSelectedUserIds, ...memberIdsToAdd])];

    // Update the 'selectedUsers' field in the form
    form.setFieldsValue({ selectedUsers: combinedIds });

    message.success(`Added ${memberIdsToAdd.length} member(s) from "${selectedCommissionObject.name}" to recipients.`);
  };


  // File Upload Handlers (remain unchanged)
  const handleFileChange = ({ fileList: newFileList }) => {
    const totalSize = newFileList.reduce((sum, file) => sum + (file.size || 0), 0);
    const totalSizeMB = totalSize / 1024 / 1024;
    if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
      message.warning(`Total attachment size exceeds ${MAX_TOTAL_SIZE_MB} MB`);
    }
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isTooLarge = file.size / 1024 / 1024 > MAX_FILE_SIZE_MB;
    if (isTooLarge) {
      message.error(`File "${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto-upload
  };

  const handleRemoveFile = (file) => {
    setFileList(fileList.filter((item) => item.uid !== file.uid));
  };

  // Handle Email Submission (remain unchanged)
  const handleSendEmail = async (values) => {
    setSending(true);
    message.loading({ content: 'Sending emails...', key: 'send', duration: 0 });

    const formData = new FormData();
    formData.append('commission_id', values.selectedCommission);
    formData.append('subject', values.subject);
    formData.append('body', values.body);

    // Ensure selectedUsers is an array before looping
    const recipientIds = Array.isArray(values.selectedUsers) ? values.selectedUsers : [];
    recipientIds.forEach((userId) => {
      formData.append('user_ids[]', userId);
    });

    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append('attachments[]', file.originFileObj, file.name);
      }
    });

    try {
      const response = await axiosClient.post('/send-commission-email', formData);
      message.success({
        content: response.data.message || 'Emails sent successfully!',
        key: 'send',
        duration: 4,
      });
      form.resetFields(); // Reset all fields
      setFileList([]); // Clear file list
      setSelectedCommissionObject(null); // Reset selected commission object state
    } catch (error) {
      let errorMsg = 'Failed to send emails.';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = Object.entries(error.response.data.errors).map(
          ([field, messages]) => `${field}: ${messages.join(', ')}`
        ).join(' | ');
        errorMsg = `Validation failed: ${errors}`;
      }
      message.error({ content: errorMsg, key: 'send', duration: 6 });
    } finally {
      setSending(false);
    }
  };


  return (
    <div style={{ padding: '32px', backgroundColor: '#f5f7fa', minHeight: '100vh' }}>
      <Card
        bordered={false}
        style={{
          maxWidth: '900px',
          margin: 'auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
        }}
      >
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <MailOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: '12px' }}>
            Send Commission Details
          </Title>
          <Text type="secondary">
            Compose and send commission updates to selected users with optional attachments.
          </Text>
        </div>

        <Spin spinning={loadingUsers || loadingCommissions || sending}>
          <Form form={form} layout="vertical" onFinish={handleSendEmail} initialValues={{ subject: 'Commission Details Update' }}>
            {/* Step 1: Recipients & Commission */}
            <Title level={4} style={{ marginBottom: '16px' }}>
              Recipients & Context
            </Title>
            <Row gutter={[24, 16]}> {/* Adjusted gutter */}
              {/* User Selection */}
              <Col xs={24}> {/* Takes full width */}
                <Form.Item
                  name="selectedUsers"
                  label={<><UserOutlined /> Select Recipients</>}
                  rules={[{ required: true, message: 'Please select at least one recipient' }]}
                >
                  <Select
                    mode="multiple" // Changed back from 'tags' to ensure only valid users are selected
                    showSearch
                    allowClear
                    optionFilterProp="label"
                    filterOption={(input, option) =>
                      option.label.toLowerCase().includes(input.toLowerCase())
                    }
                    options={users.map((user) => ({
                      value: user.id,
                      label: `${user.name} (${user.email})`, // Display name and email
                    }))}
                    placeholder="Search and select users manually..."
                    loading={loadingUsers}
                    disabled={sending}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
              {/* Commission Selection */}
              <Col xs={24} md={18}> {/* Takes more width */}
                <Form.Item
                  name="selectedCommission" // Still tracks the ID for form submission
                  label={<><TeamOutlined /> Select Commission</>}
                  rules={[{ required: true, message: 'Please select a commission' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      String(option.children).toLowerCase().includes(input.toLowerCase())
                    }
                    placeholder="Select commission to prefill members..."
                    loading={loadingCommissions}
                    disabled={sending}
                    style={{ width: '100%' }}
                    onChange={handleCommissionChange} // Call handler to update the commission object state
                  >
                    {commissions.map((commission) => (
                      <Option key={commission.id} value={commission.id}>
                        {commission.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* Add Members Button */}
               <Col xs={24} md={6} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '24px' }}> {/* Align button vertically */}
                 <Tooltip title={selectedCommissionObject ? `Add all members from "${selectedCommissionObject.name}"` : "Select a commission first"}>
                    <Button
                        icon={<UsergroupAddOutlined />}
                        onClick={handleAddCommissionMembers}
                        disabled={!selectedCommissionObject || sending} // Disable if no commission selected or sending
                        style={{ width: '100%' }}
                    >
                        Add Members
                    </Button>
                 </Tooltip>
              </Col>
            </Row>

            <Divider />

            {/* Step 2: Email Content (Unchanged) */}
            <Title level={4} style={{ marginBottom: '16px' }}>
              Email Content
            </Title>
            <Form.Item
              name="subject"
              label="Subject"
              rules={[
                { required: true, message: 'Please enter an email subject' },
                { max: 200, message: 'Subject cannot exceed 200 characters' },
              ]}
            >
              <Input prefix={<InboxOutlined />} placeholder="Enter email subject" disabled={sending} />
            </Form.Item>

            <Form.Item
              name="body"
              label="Message"
              rules={[
                { required: true, message: 'Please enter your message' },
                { max: 5000, message: 'Message body is too long' },
              ]}
              extra="This will appear above the commission details in the email."
            >
              <TextArea rows={8} placeholder="Write your message here..." disabled={sending} />
            </Form.Item>

            <Divider />

            {/* Step 3: Attachments (Unchanged) */}
            <Title level={4} style={{ marginBottom: '16px' }}>
              Attach Files (Optional)
            </Title>
            <Form.Item
              name="attachments"
              label={<><PaperClipOutlined /> Add Attachments</>}
              help={`Max ${MAX_FILE_SIZE_MB}MB per file, ${MAX_TOTAL_SIZE_MB}MB total`}
            >
              <Dragger
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={beforeUpload}
                onRemove={handleRemoveFile}
                multiple
                disabled={sending}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to this area to upload</p>
                <p className="ant-upload-hint">Support for bulk uploads. Max file size: {MAX_FILE_SIZE_MB}MB</p>
              </Dragger>
            </Form.Item>

            <Divider />

            {/* Submit Buttons (Unchanged) */}
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Space>
                <Button onClick={() => { form.resetFields(); setFileList([]); setSelectedCommissionObject(null); }} disabled={sending}>
                  Reset
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  loading={sending}
                  disabled={loadingUsers || loadingCommissions}
                >
                  Send Emails
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}