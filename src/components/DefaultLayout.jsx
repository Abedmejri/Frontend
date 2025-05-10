import { Link, Navigate, Outlet } from "react-router-dom";
import { useStateContext } from "../context/ContextProvider.jsx";
import axiosClient from "../services/axios-client.js";
import echo from "../services/echo.js";
import { useEffect, useState } from "react";
import {
  Layout,
  Menu,
  Dropdown,
  Button,
  message,
  Grid,
  Drawer,
  Space,
  Badge,
  Avatar,
  List,
  theme,
  Typography,
  FloatButton, // <-- Import FloatButton
} from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BellOutlined,
  AppstoreOutlined,
  MessageOutlined, // <-- Import MessageOutlined for chatbot icon
} from "@ant-design/icons";
import Chatbot from "./Chatbot/Chatbot.jsx";

// --- IMPORTANT ---
// Assuming you have a Chatbot component like this:
// import ChatbotComponent from '../components/ChatbotComponent'; // <-- Adjust the path as needed

const { Header, Sider, Content, Footer } = Layout;
const { useBreakpoint } = Grid;
const { useToken } = theme;
const { Title } = Typography;

export default function DefaultLayout() {
  const { user, token, setUser, setToken, notification, setNotification } = useStateContext();
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // Mobile menu drawer
  const [notifications, setNotifications] = useState([]);
  const [isChatbotDrawerVisible, setIsChatbotDrawerVisible] = useState(false); // <-- State for Chatbot Drawer
  const screens = useBreakpoint();
  const { token: themeToken } = useToken();


  const onLogout = async () => {
    try {
      await axiosClient.post("/logout");
      setUser({});
      setToken(null);
      localStorage.removeItem("ACCESS_TOKEN");
      message.success("Logged out successfully");
      // Use Navigate component or router hook for navigation instead of window.location
      // For simplicity here, keeping window.location, but react-router's navigate is preferred
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      message.error("Failed to logout");
    }
  };


  if (!token) {
    return <Navigate to="/login" />;
  }

  useEffect(() => {
    axiosClient
      .get("/user")
      .then(({ data }) => {
        setUser(data);
      })
      .catch(() => {
        // Avoid redirecting here, just show an error or handle gracefully
        message.error("Failed to fetch user data. Session might be invalid.");
        // Optional: You might want to trigger logout if user fetch fails repeatedly
        // onLogout();
      });
  }, [setUser]); // Added setUser dependency

  useEffect(() => {
    // Ensure echo is initialized before attempting to use it
    if (echo) {
        const channel = echo.channel('website-changes');
        channel.listen('WebsiteChange', (data) => {
            console.log("WebSocket Event Received:", data); // Debug log
            const newNotification = {
            message: data.message,
            time: new Date().toLocaleTimeString(),
            read: false
            };
            setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep max 50 notifications
            setNotification(data.message);

            // Auto-hide notification after 5 seconds
            setTimeout(() => {
            setNotification(null);
            }, 5000);
        });

        // Cleanup function
        return () => {
            console.log("Leaving WebSocket channel: website-changes"); // Debug log
            channel.stopListening('WebsiteChange'); // More specific stop
            echo.leaveChannel('website-changes');
        };
    } else {
        console.warn("Echo instance not available."); // Warning if echo isn't ready
    }
  }, [setNotification]); // Added setNotification dependency

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        {/* Consider adding Link here if you have a profile page */}
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<AppstoreOutlined />}>
        {/* Consider adding Link here if you have a settings page */}
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="logout"
        onClick={onLogout}
        icon={<LogoutOutlined />}
        danger
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  const notificationMenu = (
    <Menu
      style={{
        width: 320,
        maxHeight: 400,
        overflow: 'auto'
      }}
    >
      <Menu.Item key="header" disabled style={{ cursor: 'default', fontWeight: 'bold' }}>
        Notifications ({notifications.filter(n => !n.read).length})
      </Menu.Item>
      <Menu.Divider />
      {notifications.length > 0 ? (
        notifications.map((notif, index) => (
          <Menu.Item key={index} style={{ padding: '10px 16px', whiteSpace: 'normal', height: 'auto' }}>
            <List.Item style={{ padding: 0 }}>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: themeToken.colorPrimary }} icon={<BellOutlined />} />}
                title={notif.message}
                description={`Received at ${notif.time}`}
              />
            </List.Item>
          </Menu.Item>
        ))
      ) : (
        <Menu.Item key="no-notifications" style={{ textAlign: 'center', color: '#999' }}>No new notifications</Menu.Item>
      )}
      {notifications.length > 0 && (
        <>
          <Menu.Divider />
          <Menu.Item key="clear" onClick={() => setNotifications([])} style={{ textAlign: 'center', color: themeToken.colorPrimary }}>
            Clear all notifications
          </Menu.Item>
        </>
      )}
    </Menu>
  );

  // --- REMOVED CHATBOT FROM HERE ---
  let navItems;

const isAdminOrSuperAdmin = user.role === "admin" || user.role === "superadmin";

  // Define paths allowed for non-admin users
  const allowedUserPaths = ["/user_commsion", "/Schedule" ,"/dashboard",];

  // Define paths *only* admins/superadmins can access
  // (All paths under DefaultLayout EXCEPT allowedUserPaths are admin-only by default if the user is not admin)
  const adminOnlyPaths = [
    "/dashboard",
    "/users", // and /users/new, /users/:id
    "/commissions",
    "/meetings",
    "/pvs",
    "/auto",
    "/send-email",
    "/chatbot", // Assuming chatbot is admin only too, adjust if not
  ];


// Define the common items for non-admins
const userSpecificItems = [
 
  {
    key: "8",
    icon: <FileTextOutlined />,
    label: <Link to="/user_commsion">MyCommssions</Link>,
  },
  {
    key: "9",
    // Consider using CalendarOutlined for Schedule if it makes more sense semantically
    icon: <CalendarOutlined />, // Or FileTextOutlined if you prefer
    label: <Link to="/Schedule">Schedule</Link>,
  },
  
];

if (isAdminOrSuperAdmin) {
  navItems = [
    {
      key: "1",
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">Dashboard</Link>,
    },
    // "Users" link is only for admin/superadmin
    {
      key: "2",
      icon: <UserOutlined />,
      label: <Link to="/users">Users</Link>,
    },
    {
      key: "3",
      icon: <TeamOutlined />,
      label: <Link to="/commissions">Commissions</Link>,
    },
    {
      key: "4",
      icon: <CalendarOutlined />,
      label: <Link to="/meetings">Meetings</Link>,
    },
    {
      key: "5",
      icon: <FileTextOutlined />,
      label: <Link to="/pvs">Manual_PV</Link>,
    },
    {
      key: "6",
      icon: <FileTextOutlined />,
      label: <Link to="/auto">IA_PV</Link>,
    },
    {
      key: "7",
      icon: <FileTextOutlined />,
      label: <Link to="/send-email">Sendmails</Link>,
    },
   
    // Admins/Superadmins also see "MyCommissions" and "Schedule"
    ...userSpecificItems,
  ];
} else {
  // Other users only see "MyCommissions" and "Schedule"
  navItems = userSpecificItems;
}

  // --- Function to toggle Chatbot Drawer ---
  const showChatbotDrawer = () => {
    setIsChatbotDrawerVisible(true);
  };

  const closeChatbotDrawer = () => {
    setIsChatbotDrawerVisible(false);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar for Desktop */}
      {screens.md ? (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="light"
          width={240}
          style={{
            overflow: "auto",
            height: "100vh",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
            zIndex: 10
          }}
        >
          <div
            style={{
              height: "64px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: themeToken.colorPrimary,
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {collapsed ? (
              <AppstoreOutlined style={{ fontSize: 24 }} />
            ) : (
              <Title level={4} style={{ color: "white", margin: "0" }}>CommissionFlow Ai</Title>
            )}
          </div>
          <Menu
            theme="light"
            mode="inline"
            // Update selected keys based on current route if needed
            // defaultSelectedKeys={["1"]} // Might need dynamic selection
            items={navItems}
            style={{ borderRight: 0 }}
          />
        </Sider>
      ) : (
        // Mobile Menu Button
        <Button
          type="text"
          icon={<MenuOutlined />}
          style={{
            position: "fixed",
            top: 16,
            left: 16,
            zIndex: 100, // Ensure it's above content
            backgroundColor: "white",
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
          onClick={() => setDrawerVisible(true)}
        />
      )}

      {/* Mobile Drawer (for main navigation) */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <AppstoreOutlined style={{ marginRight: 8, color: themeToken.colorPrimary }} />
            <span>CommissionFlow Ai</span>
          </div>
        }
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible && !screens.md} // Only open if mobile menu should be visible
        width={280}
        bodyStyle={{ padding: 0 }}
        zIndex={101} // Ensure it's above mobile menu button
      >
        <Menu
          theme="light"
          mode="inline"
          // Update selected keys based on current route if needed
          // defaultSelectedKeys={["1"]}
          items={navItems}
          style={{ borderRight: 0 }}
          onClick={() => setDrawerVisible(false)} // Close drawer on item click
        />
      </Drawer>

      {/* Main Layout Area */}
      <Layout
        style={{
          // Adjust margin based on sidebar state and screen size
          marginLeft: screens.md ? (collapsed ? 80 : 240) : 0,
          transition: 'margin-left 0.2s', // Smooth transition for sidebar collapse
        }}
      >
        {/* Header */}
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 9, // Below sidebar/drawers
            width: "100%",
            display: "flex",
            justifyContent: screens.md ? "flex-end" : "space-between", // Adjust header content alignment
            alignItems: "center",
            padding: `0 ${screens.md ? '24px' : '16px'}`, // Responsive padding
            background: "#fff",
            boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)", // Subtle shadow
          }}
        >
           {/* Show title on mobile */}
          {!screens.md && (
             <Title level={4} style={{ margin: 0, color: themeToken.colorPrimary }}>
                CommissionFlow Ai
             </Title>
          )}

          <Space size="middle">
            <Dropdown
              overlay={notificationMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Badge count={notifications.filter(n => !n.read).length} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: "18px", color: "#555" }} />}
                  style={{ height: 40, width: 40 }}
                  aria-label="Notifications"
                />
              </Badge>
            </Dropdown>

            <Dropdown
              overlay={userMenu}
              placement="bottomRight"
              trigger={["click"]}
              arrow={{ pointAtCenter: true }}
            >
              <Button type="text" style={{ height: '100%', padding: '0 12px' }}>
                <Space>
                  <Avatar
                    style={{ backgroundColor: themeToken.colorPrimary }}
                    icon={<UserOutlined />}
                    size="small"
                  />
                  {/* Hide name on very small screens if needed */}
                  {screens.xs ? null : (
                    <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                      {user.name || 'User'}
                    </span>
                  )}
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        {/* Main Content */}
        <Content
          style={{
            padding: screens.md ? "24px" : "16px",
            margin: "0", // No extra margin needed
            // overflow: 'initial' // Allow content scrolling
          }}
        >
          <div
            style={{
              padding: screens.md ? 24 : 16,
              minHeight: `calc(100vh - 64px - ${screens.md ? '69px' : '61px'})`, // Adjust minHeight based on footer height
              background: themeToken.colorBgContainer, // Use theme background
              borderRadius: themeToken.borderRadiusLG, // Use theme border radius
              // boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" // Optional subtle shadow
            }}
          >
            <Outlet /> {/* Renders the matched child route component */}
          </div>
        </Content>

        {/* Footer */}
        <Footer style={{ textAlign: "center", padding: screens.md ? "24px 50px" : "16px 20px", background: 'transparent' }}>
          CommissionFlow Ai ©{new Date().getFullYear()}
        </Footer>
      </Layout>

     

      {/* --- Chatbot Drawer --- */}
     
      <Chatbot /> 

      {/* Toast Notification */}
      {notification && (
        <div
          // className="notification" - Using inline styles
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "12px 24px",
            background: themeToken.colorSuccessBg, // Use theme token
            border: `1px solid ${themeToken.colorSuccessBorder}`, // Use theme token
            borderRadius: themeToken.borderRadiusLG,
            boxShadow: themeToken.boxShadowSecondary, // Use theme token
            zIndex: 1050, // Ensure it's above most content, maybe below drawers
            display: "flex",
            alignItems: "center",
            gap: 12,
            maxWidth: "calc(100vw - 48px)", // Prevent overflow on small screens
            transition: "opacity 0.3s ease, transform 0.3s ease",
            opacity: 1,
            transform: 'translateX(0)',
            // animation: "slideIn 0.3s forwards" // Animation replaced with transition
          }}
          role="alert"
          aria-live="polite"
        >
          <BellOutlined style={{ color: themeToken.colorSuccess }} />
          <span style={{ flexGrow: 1 }}>{notification}</span>
          <Button
            type="text"
            size="small"
            icon={<LogoutOutlined rotate={45}/>} // Using close icon (represented by rotated logout)
            onClick={() => setNotification(null)}
            style={{ marginLeft: 16, padding: 0, color: '#888' }}
            aria-label="Close notification"
          />
        </div>
      )}

      
    </Layout>
  );
}