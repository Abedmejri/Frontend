import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FloatButton, Card, Input, Button, List, Avatar, Spin, message, Space, Typography } from 'antd';
import { MessageOutlined, RobotOutlined, UserOutlined, SendOutlined, CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import axiosClient from '../../services/axios-client'; // Adjust path if needed
import { useNavigate } from 'react-router-dom'; // Ensure react-router-dom is installed

const { Text } = Typography;

// --- Style Objects ---
const chatbotCardStyle = {
  position: 'fixed',
  bottom: 90, // Position above the float button
  right: 24,
  width: 350,
  maxWidth: '90vw',
  height: 500,
  maxHeight: '70vh',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
  borderRadius: 8,
  zIndex: 1000,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#fff', // Ensure background
  overflow: 'hidden', // Prevent content overflow
};

const cardBodyStyle = {
  padding: 0, // Remove default padding
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden', // Prevent inner content overflow
};

const messageListStyle = {
  flexGrow: 1, // Allow list to take up available space
  overflowY: 'auto', // Enable vertical scrolling
  padding: '12px 16px',
  backgroundColor: '#f5f5f5', // Light background for message area
};

const inputAreaStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  borderTop: '1px solid #f0f0f0', // Separator line
  backgroundColor: '#fff',
};

const loadingIndicatorStyle = {
  textAlign: 'center',
  padding: '10px',
  color: '#888',
  fontStyle: 'italic',
};

// --- Component ---
export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    // Initial welcome message
    { sender: 'bot', text: 'Hello! How can I help you today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null); // Ref to scroll to bottom
  const navigate = useNavigate(); // Hook for navigation

  // Effect to scroll down when messages change or chat opens
  useEffect(() => {
    if (isOpen) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, isOpen]);

  // Toggle chat window visibility
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Update input field state
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Handle actions received from the backend (e.g., navigation)
  const handleAction = useCallback((action) => {
    if (!action || !action.type) return;
    console.log('[Chatbot] Handling action:', action);

    switch (action.type) {
      case 'navigate':
        if (action.target) {
           message.loading({ content: `Navigating...`, key: 'nav', duration: 1.5 });
           // Use react-router's navigate function, passing params via state
           navigate(action.target, { state: action.params || {} });
           setIsOpen(false); // Close chat window after navigation
        } else {
           console.warn('[Chatbot] Navigate action missing target path.');
        }
        break;
      // Add more cases here for future action types if needed
      default:
        console.warn('[Chatbot] Received unhandled action type:', action.type);
    }
  }, [navigate]); // Dependency: navigate function

  // Handle sending a message to the backend
  const handleSendMessage = async () => {
    const userMessageText = inputValue.trim();
    if (!userMessageText || isLoading) return; // Don't send empty or while loading

    const newUserMessage = { sender: 'user', text: userMessageText };
    // Keep a local copy for history and update UI immediately
    const currentMessages = [...messages, newUserMessage];
    setMessages(currentMessages);
    setInputValue(''); // Clear input field
    setIsLoading(true); // Set loading state

    try {
        // Prepare recent message history to send for context
        // Send last 6 messages (3 user, 3 bot), excluding errors
        const historyToSend = currentMessages.slice(-6).map(msg => ({
            sender: msg.sender,
            text: msg.text
        })).filter(msg => !msg.isError);

        // Send message and history to backend API endpoint
        const response = await axiosClient.post('/chatbot', {
            message: userMessageText,
            history: historyToSend
        });

        // Process backend response
        // Expecting format: { reply: "...", action?: {...} }
        if (response.data && response.data.reply) {
            const botMessage = { sender: 'bot', text: response.data.reply };
            // Add bot's reply to the message list
            setMessages((prevMessages) => [...prevMessages, botMessage]);

            // If the backend included an action, handle it after showing the reply
            if (response.data.action) {
                 // Short delay so user sees the reply before UI changes
                 setTimeout(() => handleAction(response.data.action), 300);
            }
        } else {
            // Throw error if response format is unexpected
             throw new Error("Invalid response format from server.");
        }

    } catch (error) {
        // Handle API errors
        console.error("Chatbot error:", error);
        // Display error message in the chat window
        const errorText = error.response?.data?.message || "Sorry, I couldn't connect or process your request.";
        const errorMessage = { sender: 'bot', text: errorText, isError: true };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
        // Show toast/message notification for the error
        message.error('Failed to get chatbot response.');
    } finally {
        // Reset loading state regardless of success or failure
        setIsLoading(false);
    }
  };

  // Handle Enter key press in the input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a newline
      handleSendMessage(); // Send message on Enter
    }
  };

  // Function to render individual message bubbles with appropriate styling
  const renderMessageContent = (item) => {
    // Base styles for all bubbles
    const baseBubbleStyle = {
        padding: '8px 12px',
        borderRadius: '15px',
        display: 'inline-block', // Fit content
        maxWidth: '80%', // Prevent bubbles from being too wide
        wordWrap: 'break-word', // Allow long words to break
        textAlign: 'left', // Align text inside bubble left
    };

    let bubbleStyle; // Specific styles based on sender/error

    if (item.sender === 'user') {
      // User message styles (blue background, different border radius)
      bubbleStyle = {
        ...baseBubbleStyle,
        backgroundColor: '#1890ff',
        color: 'white',
        borderRadius: '15px 15px 0 15px', // Tail bottom-right
      };
    } else { // Bot or Error message
      // Bot message styles (light grey background)
      bubbleStyle = {
        ...baseBubbleStyle,
        backgroundColor: '#e9e9eb',
        color: '#333',
        borderRadius: '15px 15px 15px 0', // Tail bottom-left
      };
      // Override styles if it's an error message
      if (item.isError) {
        bubbleStyle = {
            ...bubbleStyle, // Keep basic shape
            backgroundColor: '#fff1f0', // Light red background
            border: '1px solid #ffa39e', // Red border
            color: '#cf1322', // Dark red text
        };
      }
    }

    // Return the styled div containing the message text
    return (
        <div style={bubbleStyle}>
            <Text style={{ color: 'inherit' }}>{item.text}</Text>
        </div>
    );
  };


  // --- Render the Component ---
  return (
    <>
      {/* Floating button to open/close the chat */}
      <FloatButton
        icon={<MessageOutlined />}
        type="primary"
        onClick={toggleChat}
        tooltip="Chat with Assistant"
        style={{ right: 24, bottom: 24, zIndex: 1001 }} // Ensure button is above chat card
      />

      {/* Chat window Card - only renders if isOpen is true */}
      {isOpen && (
        <Card
          title={
            <Space>
              <RobotOutlined /> Chat Assistant
            </Space>
          }
          bordered={false}
          style={chatbotCardStyle} // Apply card container styles
          bodyStyle={cardBodyStyle} // Apply card body styles (for flex layout)
          // Close button in the card header
          extra={<Button type="text" icon={<CloseOutlined />} onClick={toggleChat} />}
        >
          {/* Message List Area - Wrapped in a div for scrolling */}
          <div style={messageListStyle}>
             <List
                itemLayout="horizontal" // Standard layout for items with avatar/content
                dataSource={messages} // Array of message objects
                renderItem={(item, index) => {
                   const isUser = item.sender === 'user';
                   // Styles to align the whole list item left or right
                   const itemStyle = {
                      display: 'flex',
                      justifyContent: isUser ? 'flex-end' : 'flex-start',
                      marginBottom: '10px',
                      padding: '0 5px',
                   };
                   // Styles for the Meta component (avatar + content area)
                   const metaStyle = {
                        maxWidth: '100%', // Allow it to fill available width
                        alignItems: 'flex-start', // Align avatar to the top of the bubble
                        flexDirection: isUser ? 'row-reverse' : 'row', // Reverse avatar/content for user
                    };

                   return (
                      // Apply alignment style to the List.Item
                      <List.Item style={itemStyle} key={index} bordered={false}>
                         <List.Item.Meta
                           style={metaStyle} // Apply flex direction style
                           // Display avatar based on sender
                           avatar={
                              <Avatar
                                icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                                // Adjust margin based on side
                                style={{ margin: isUser ? '0 0 0 8px' : '0 8px 0 0' }}
                              />
                           }
                           // Use the custom function to render the styled message bubble
                           description={renderMessageContent(item)}
                         />
                      </List.Item>
                   );
                }}
             >
                {/* Loading indicator shown while waiting for backend response */}
                {isLoading && (
                    <div style={loadingIndicatorStyle}>
                        <Spin size="small" style={{ marginRight: 8 }} />
                        <LoadingOutlined /> Thinking... {/* Indicate AI processing */}
                    </div>
                )}
                 {/* Empty div used as a target for scrolling to the bottom */}
                <div ref={messagesEndRef} style={{ height: '1px' }} />
             </List>
          </div> {/* End Message List Area */}

          {/* Input Area at the bottom */}
          <div style={inputAreaStyle}>
            <Input.TextArea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress} // Send on Enter
              placeholder="Type your message..."
              autoSize={{ minRows: 1, maxRows: 3 }} // Allow input to grow slightly
              disabled={isLoading} // Disable input while loading
              style={{ marginRight: 8 }} // Space between input and button
            />
            {/* Send button */}
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendMessage}
              loading={isLoading} // Show loading state on button
              disabled={!inputValue.trim()} // Disable if input is empty
            />
          </div> {/* End Input Area */}
        </Card>
      )}
    </>
  );
}