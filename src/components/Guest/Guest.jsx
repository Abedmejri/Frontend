import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Button,
  Row,
  Col,
  Card,
  Typography,
  Space,
  Avatar,
  Divider,
  Badge // Keep Badge if needed elsewhere, otherwise remove if unused
} from 'antd';
import {
  RocketOutlined,
  TeamOutlined,
  ScheduleOutlined,
  RobotOutlined,
  // FileTextOutlined, // Removed as unused
  ArrowRightOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ThunderboltOutlined,
  LockOutlined
} from '@ant-design/icons';
import Chatbot from '../Chatbot/Chatbot'; // Assuming Chatbot component exists

const { Header, Content, Footer } = Layout;
const { Title, Paragraph, Text } = Typography;

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};


function Guest() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [animateHero, setAnimateHero] = useState(false);
  const [animateFeatures, setAnimateFeatures] = useState(false);
  const [animateAI, setAnimateAI] = useState(false);
  const [animateCTA, setAnimateCTA] = useState(false);

  // Handle scroll animations
  useEffect(() => {
    const handleScroll = () => {
      // Header shadow effect
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Element animations based on scroll position
      const heroSection = document.getElementById('hero-section');
      const featuresSection = document.getElementById('features-section');
      const aiSection = document.getElementById('ai-section');
      const ctaSection = document.getElementById('cta-section');
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      // Adjust offset for earlier triggering if needed
      const triggerOffset = 100;

      if (heroSection && scrollY < windowHeight / 2) { // Trigger hero animation almost immediately or based on top visibility
        setAnimateHero(true);
      }

      if (featuresSection && scrollY + windowHeight >= featuresSection.offsetTop + triggerOffset) {
        setAnimateFeatures(true);
      }

      if (aiSection && scrollY + windowHeight >= aiSection.offsetTop + triggerOffset) {
        setAnimateAI(true);
      }

      if (ctaSection && scrollY + windowHeight >= ctaSection.offsetTop + triggerOffset) {
        setAnimateCTA(true);
      }
    };

    // Initial trigger for hero animation after a short delay
    setTimeout(() => {
      setAnimateHero(true);
    }, 300);

    window.addEventListener('scroll', handleScroll, { passive: true }); // Use passive listener for better performance
    handleScroll(); // Initial check on load

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStartedClick = () => {
    navigate('/login');
  };

  const handleSignUpClick = () => {
    navigate('/signup');
  };

  // Keyframe animations (defined as objects for inline usage)
  const animations = {
    fadeInUp: {
      opacity: 0,
      transform: 'translateY(30px)',
      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out', // Use ease-out for smoother end
    },
    fadeInUpActive: {
      opacity: 1,
      transform: 'translateY(0)',
    },
    fadeInLeft: {
      opacity: 0,
      transform: 'translateX(-30px)',
      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
    },
    fadeInLeftActive: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    fadeInRight: {
      opacity: 0,
      transform: 'translateX(30px)',
      transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
    },
    fadeInRightActive: {
      opacity: 1,
      transform: 'translateX(0)',
    },
    scaleIn: {
      opacity: 0,
      transform: 'scale(0.95)',
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    },
    scaleInActive: {
      opacity: 1,
      transform: 'scale(1)',
    }
  };

  // Add global styles for animations
  useEffect(() => {
    // Create style element for global animations
    const styleEl = document.createElement('style');

    // Define keyframe animations
    styleEl.textContent = `
      @keyframes float {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-15px) rotate(1deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }

      @keyframes float-reverse {
        0% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(15px) rotate(-1deg); }
        100% { transform: translateY(0px) rotate(0deg); }
      }

      @keyframes pulse {
        0% { opacity: 0.5; transform: scale(0.95); }
        50% { opacity: 1; transform: scale(1.05); }
        100% { opacity: 0.5; transform: scale(0.95); }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes ripple {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        40% { opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(1.2); opacity: 0; }
      }

      @keyframes pulse-glow {
        0% { opacity: 0; }
        50% { opacity: 0.3; }
        100% { opacity: 0; }
      }

      /* Basic hover effect for benefit items */
      .benefit-item-hover:hover {
        transform: translateX(5px);
        opacity: 0.8;
      }
      /* Simple hover for Learn More link */
      .learn-more-link:hover {
        opacity: 0.8;
      }
    `;

    // Add to document head
    document.head.appendChild(styleEl);

    // Cleanup on unmount
    return () => {
      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);

  // Professional enhanced styles - modernized with design expertise
  const styles = {
    layout: {
      background: '#fafafa', // Subtle off-white background for better contrast
      overflowX: 'hidden', // Prevent horizontal scroll from animations/decorations
    },
    header: {
      position: 'fixed',
      zIndex: 10,
      width: '100%',
      backgroundColor: scrolled ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)', // Modern glass effect
      WebkitBackdropFilter: 'blur(10px)', // Safari support
      boxShadow: scrolled
        ? '0 4px 20px rgba(0, 0, 0, 0.06)'
        : 'none',
      padding: '0 50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '74px', // Slightly taller header
      transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)', // Refined animation curve
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
    },
    logoText: {
      fontWeight: 'bold',
      fontSize: '24px',
      letterSpacing: '-0.5px', // Tighter letter spacing for modern look
      display: 'inline-block',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      position: 'relative',
      margin: 0, // Ensure no default margin from Typography
    },
    content: {
      padding: '0',
      marginTop: 74, // Match header height
      minHeight: 'calc(100vh - 74px - 80px)', // Adjust min height based on header/footer
    },
    heroSection: {
      padding: '150px 50px 120px', // More top padding for better hierarchy
      background: 'linear-gradient(135deg, #f8faff 0%, #edf7ff 50%, #f0f9ff 100%)',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid rgba(0,0,0,0.02)',
    },
    heroContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    heroDecoration: {
      position: 'absolute',
      width: '1000px', // Larger decoration
      height: '1000px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(75,0,130,0.03) 0%, rgba(0,0,255,0.01) 70%, rgba(0,0,0,0) 100%)',
      top: '-350px',
      right: '-200px',
      zIndex: 1,
      pointerEvents: 'none',
      animation: 'float 15s ease-in-out infinite alternate', // Subtle floating animation
    },
    heroDecoration2: {
      position: 'absolute',
      width: '800px', // Larger decoration
      height: '800px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(0,128,128,0.02) 0%, rgba(0,255,255,0.01) 70%, rgba(0,0,0,0) 100%)',
      bottom: '-250px',
      left: '-150px',
      zIndex: 1,
      pointerEvents: 'none',
      animation: 'float-reverse 18s ease-in-out infinite alternate', // Different timing and direction
    },
    featuresSection: {
      padding: '120px 50px', // More padding
      background: '#fff',
      position: 'relative',
    },
    featuresContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    featureCard: {
      borderRadius: '16px', // Increased border radius
      border: '1px solid #f0f0f0',
      boxShadow: '0 10px 40px rgba(0,0,0,0.04)', // Softer shadow for depth
      height: '100%',
      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing curve
      transform: 'translateY(0)',
      overflow: 'hidden',
      display: 'flex', // Make card a flex container
      flexDirection: 'column', // Stack elements vertically
    },
    featureCardBody: {
        padding: '36px', // More padding
        flexGrow: 1, // Allow body to grow
        display: 'flex',
        flexDirection: 'column',
    },
    iconWrapper: {
      padding: '32px 0 24px',
      display: 'flex',
      justifyContent: 'center',
    },
    featureIcon: {
      fontSize: '48px',
      color: '#1890ff',
      transition: 'all 0.3s ease',
    },
    aiHighlightSection: {
      padding: '140px 50px', // More padding
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f5ff 100%)',
      position: 'relative',
      overflow: 'hidden',
    },
    aiHighlightContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    aiDecoration: {
      position: 'absolute',
      width: '1200px', // Larger decoration
      height: '1200px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(24,144,255,0.03) 0%, rgba(0,100,255,0.01) 70%, rgba(0,0,0,0) 100%)',
      top: '-500px',
      right: '-300px',
      zIndex: 1,
      pointerEvents: 'none',
      animation: 'float 20s ease-in-out infinite alternate', // Subtle floating animation
    },
    aiHighlightImageContainer: {
      backgroundColor: '#fff',
      padding: '50px 30px', // More padding
      borderRadius: '20px', // Increased border radius
      boxShadow: '0 20px 60px rgba(0,0,0,0.08)', // More professional shadow
      textAlign: 'center',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      position: 'relative',
      border: '1px solid rgba(0,0,0,0.03)',
    },
    imageGlow: {
      position: 'absolute',
      width: '180px', // Larger glow
      height: '180px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(82,196,26,0.15) 0%, rgba(82,196,26,0.05) 50%, rgba(0,0,0,0) 80%)',
      zIndex: 0,
      pointerEvents: 'none',
      animation: 'pulse 8s ease-in-out infinite', // Pulsing animation
    },
    aiHighlightTextCol: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      height: '100%', // Ensure column takes full height
    },
    benefitsList: {
      marginTop: '36px', // More spacing
      marginBottom: '45px',
      paddingLeft: 0, // Remove default list padding
      listStyle: 'none', // Remove default list bullets
    },
    benefitItem: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '22px', // More spacing
      transition: 'transform 0.3s ease, opacity 0.3s ease', // Added opacity for enhanced hover
      transform: 'translateX(0)',
      opacity: 1,
      cursor: 'default', // Indicate non-interactive, unless you add hover effects
    },
    benefitIcon: {
      color: '#52c41a',
      fontSize: '22px', // Larger icon
      marginRight: '18px', // More spacing
      filter: 'drop-shadow(0 3px 6px rgba(82,196,26,0.3))', // Enhanced shadow
      flexShrink: 0, // Prevent icon from shrinking
    },
    ctaSection: {
      padding: '150px 50px', // More padding
      background: '#fff',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid rgba(0,0,0,0.03)',
    },
    ctaContainer: {
      maxWidth: '800px',
      margin: '0 auto',
      position: 'relative',
      zIndex: 2,
    },
    ctaDecoration: {
      position: 'absolute',
      width: '900px', // Larger decoration
      height: '900px',
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(24,144,255,0.04) 0%, rgba(0,0,0,0.01) 70%, rgba(0,0,0,0) 100%)',
      bottom: '-450px',
      left: '30%',
      transform: 'translateX(-50%)',
      zIndex: 1,
      pointerEvents: 'none',
      animation: 'float-reverse 25s ease-in-out infinite alternate', // Subtle floating animation
    },
    footer: {
      textAlign: 'center',
      backgroundColor: '#001529',
      color: 'rgba(255, 255, 255, 0.7)', // Improved contrast
      padding: '40px 50px', // More padding
    },
    // --- Button Specific Styles with Hover Logic ---
    getStartedButtonBase: {
      height: '46px',
      borderRadius: '10px', // More rounded
      fontSize: '16px',
      fontWeight: 500,
      boxShadow: '0 5px 15px rgba(24,144,255,0.25)', // Refined shadow
      transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      border: 'none',
      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', // Ensure base has gradient
      color: '#fff', // Ensure text is white
    },
    getStartedButtonHover: {
      transform: 'translateY(-3px)', // More pronounced lift
      boxShadow: '0 8px 20px rgba(24,144,255,0.35), 0 0 15px rgba(24,144,255,0.2)', // Enhanced shadow on hover + glow
    },
    signUpButtonBase: {
      height: '46px',
      borderRadius: '10px', // More rounded
      fontWeight: 500,
      border: '1px solid rgba(0,0,0,0.08)', // Subtle border
      transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      boxShadow: 'none',
      backgroundColor: '#fff', // Ensure background for contrast
      color: '#333', // Default text color
    },
    signUpButtonHover: {
      transform: 'translateY(-3px)', // More pronounced lift
      boxShadow: '0 8px 20px rgba(0,0,0,0.05)', // Enhanced shadow on hover
      borderColor: 'rgba(0,0,0,0.15)', // Darker border on hover
    },
    heroButtonBase: {
      height: '58px', // Taller button
      fontWeight: 500,
      fontSize: '18px', // Larger text
      padding: '0 40px', // More padding
      borderRadius: '12px', // More rounded
      boxShadow: '0 8px 25px rgba(24,144,255,0.3)', // More professional shadow
      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      border: 'none',
      position: 'relative', // For before/after pseudo elements
      overflow: 'hidden', // For shimmer effect
      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', // Gradient background
      color: '#fff', // White text
    },
    heroButtonHover: {
      transform: 'translateY(-4px)', // More pronounced lift
      boxShadow: '0 12px 30px rgba(24,144,255,0.4), 0 0 15px rgba(24,144,255,0.3)', // Enhanced shadow on hover + glow
    },
    aiButtonBase: {
      height: '52px', // Taller button
      fontSize: '17px', // Larger text
      fontWeight: 500,
      borderRadius: '10px', // More rounded
      boxShadow: '0 8px 20px rgba(82,196,26,0.2)', // Refined shadow
      transition: 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0 30px', // More padding
      backgroundColor: '#52c41a', // Green background
      color: '#fff', // White text
    },
    aiButtonHover: {
      transform: 'translateY(-4px)', // More pronounced lift
      boxShadow: '0 12px 25px rgba(82,196,26,0.3)', // Enhanced shadow on hover
      backgroundColor: '#4CAF50', // Slightly darker green on hover
    },
    ctaButtonBase: {
      height: '58px', // Taller button
      fontSize: '18px', // Larger text
      fontWeight: 500,
      padding: '0 40px', // More padding
      borderRadius: '12px', // More rounded
      boxShadow: '0 8px 25px rgba(24,144,255,0.25)', // More professional shadow
      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      border: 'none',
      position: 'relative', // For before/after pseudo elements
      overflow: 'hidden', // For shimmer effect
      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', // Gradient background
      color: '#fff', // White text
    },
    ctaButtonHover: {
      transform: 'translateY(-4px)', // More pronounced lift
      boxShadow: '0 12px 30px rgba(24,144,255,0.35), 0 0 15px rgba(24,144,255,0.3)', // Enhanced shadow on hover + glow
    },
    // --- End Button Styles ---
    statCardBase: {
      padding: '32px 24px', // More padding
      textAlign: 'center',
      borderRadius: '16px', // More rounded
      background: 'white',
      boxShadow: '0 12px 30px rgba(0,0,0,0.05)', // Refined shadow
      transition: 'all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)', // Professional easing
      border: '1px solid rgba(0,0,0,0.02)',
      transform: 'translateY(0) scale(1)', // Base transform state
      height: '100%', // Ensure cards are same height
    },
    statCardHover: {
      // Note: The 3D tilt is handled by JS event listeners, these are fallbacks/base hover
      transform: 'translateY(-6px) scale(1.02)', // Simplified lift and scale
      boxShadow: '0 18px 40px rgba(0,0,0,0.08)', // Enhanced shadow on hover
    },
    statNumber: {
      fontSize: '44px', // Larger text
      fontWeight: 700,
      color: '#1890ff', // Fallback color
      marginBottom: '8px',
      lineHeight: 1,
      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)', // Gradient for numbers
      WebkitBackgroundClip: 'text',
      backgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textFillColor: 'transparent', // Standard property
    },
    pillBadge: {
      display: 'inline-block',
      fontSize: '13px', // Slightly larger
      fontWeight: 600, // Bolder
      lineHeight: '22px',
      padding: '2px 14px', // More padding
      borderRadius: '12px', // More rounded
      backgroundColor: hexToRgba('#52c41a', 0.08), // More subtle background using helper
      color: '#52c41a',
      marginBottom: '26px', // More spacing
      letterSpacing: '0.5px', // Letter spacing for badges
      textTransform: 'uppercase', // All caps for more distinction
    },
    heroPillBadge: {
      display: 'inline-block',
      fontSize: '14px', // Larger
      fontWeight: 600, // Bolder
      lineHeight: '24px',
      padding: '4px 16px', // More padding
      borderRadius: '14px', // More rounded
      backgroundColor: hexToRgba('#5A67D8', 0.08), // More subtle background using helper
      color: '#5A67D8',
      marginBottom: '28px', // More spacing
      letterSpacing: '0.5px', // Letter spacing for badges
      textTransform: 'uppercase', // All caps for more distinction
      boxShadow: '0 4px 12px rgba(90, 103, 216, 0.1)', // Subtle shadow for depth
    },
    chatbotContainer: {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 100,
    }
  };

  // Helper function for mouse enter/leave styles (applies base/hover styles)
  const handleMouseEnter = (e, styleName) => {
    Object.assign(e.currentTarget.style, styles[`${styleName}Hover`]);
  };

  const handleMouseLeave = (e, styleName) => {
    // Reset specific hover styles before applying base styles
    e.currentTarget.style.transform = styles[`${styleName}Base`].transform || 'none';
    e.currentTarget.style.boxShadow = styles[`${styleName}Base`].boxShadow || 'none';
    e.currentTarget.style.borderColor = styles[`${styleName}Base`].borderColor || 'transparent'; // Adjust if needed
    e.currentTarget.style.backgroundColor = styles[`${styleName}Base`].backgroundColor || 'transparent';
    // Apply all base styles again to ensure consistency
    Object.assign(e.currentTarget.style, styles[`${styleName}Base`]);
  };

  // Benefits list for AI section
  const aiBenefits = [
    'Save up to 75% of documentation time',
    'Capture every important detail automatically',
    'Smart formatting with consistent structure',
    'Multilingual support for global teams'
  ];

  // Stats for hero section
  const stats = [
    { number: '93%', label: 'Time Saved', icon: <ClockCircleOutlined /> },
    { number: '1K+', label: 'Active Users', icon: <TeamOutlined /> },
    { number: '99.9%', label: 'Uptime', icon: <ThunderboltOutlined /> },
  ];

  // Scroll indicator animation
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScrollIndicator = () => {
      // Calculate scroll percentage
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight;
      // Prevent division by zero if scrollHeight equals clientHeight
      const totalScrollableHeight = scrollHeight - clientHeight;
      const scrolled = totalScrollableHeight > 0 ? (scrollTop / totalScrollableHeight) * 100 : 0;
      setScrollPercentage(Math.min(scrolled, 100)); // Cap at 100%
    };

    window.addEventListener('scroll', handleScrollIndicator);
    handleScrollIndicator(); // Initial calculation
    return () => window.removeEventListener('scroll', handleScrollIndicator);
  }, []);

  return (
    <Layout style={styles.layout}>
      {/* --- Scroll Progress Indicator --- */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${scrollPercentage}%`, // Use state variable directly
        height: '3px',
        background: 'linear-gradient(90deg, #4299E1 0%, #5A67D8 50%, #38A169 100%)',
        zIndex: 1000,
        transition: 'width 0.1s ease-out', // Smooth width change
      }}></div>

      {/* --- Navbar --- */}
      <Header style={styles.header}>
        {/* Logo/Brand Name */}
        <div style={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ ...styles.logoText, color: '#4299E1' }}>Commis</Text>
            <Text style={{ ...styles.logoText, color: '#38A169' }}>sionFlow</Text>
            <Text style={{ ...styles.logoText, color: '#5A67D8', marginLeft: '4px' }}>AI</Text> {/* Adjusted margin */}
          </div>
        </div>

        {/* Navigation Buttons */}
        <Space size="large"> {/* Increased spacing */}
          <Button
            type="default"
            onClick={handleSignUpClick}
            style={{
              ...styles.signUpButtonBase,
              position: 'relative', // Needed for ripple
              overflow: 'hidden',   // Needed for ripple
            }}
            onMouseEnter={(e) => {
              handleMouseEnter(e, 'signUpButton');
              // Trigger ripple effect
              const button = e.currentTarget;
              const ripple = document.createElement('span');
              const rect = button.getBoundingClientRect();
              const size = Math.max(rect.width, rect.height);
              const x = e.clientX - rect.left - size / 2;
              const y = e.clientY - rect.top - size / 2;

              ripple.style.width = ripple.style.height = `${size}px`;
              ripple.style.left = `${x}px`;
              ripple.style.top = `${y}px`;
              ripple.style.position = 'absolute';
              ripple.style.borderRadius = '50%';
              ripple.style.background = 'rgba(0, 0, 0, 0.1)'; // Ripple color
              ripple.style.transform = 'scale(0)';
              ripple.style.animation = 'ripple 0.6s linear';
              ripple.style.pointerEvents = 'none'; // Ensure ripple doesn't block clicks

              button.appendChild(ripple);
              setTimeout(() => {
                if (button.contains(ripple)) {
                    button.removeChild(ripple);
                }
              }, 600);
            }}
            onMouseLeave={(e) => handleMouseLeave(e, 'signUpButton')}
          >
            Sign Up
          </Button>
          <Button
            type="primary" // Antd type=primary handles basic styling
            icon={<RocketOutlined style={{ fontSize: '16px' }} />}
            onClick={handleGetStartedClick}
            style={styles.getStartedButtonBase} // Apply base styles
            onMouseEnter={(e) => handleMouseEnter(e, 'getStartedButton')}
            onMouseLeave={(e) => handleMouseLeave(e, 'getStartedButton')}
          >
            Get Started
          </Button>
        </Space>
      </Header>

      {/* --- Main Content --- */}
      <Content style={styles.content}>
        {/* --- Hero Section --- */}
        <div
          id="hero-section"
          style={styles.heroSection}
        >
          {/* Decorative elements */}
          <div style={styles.heroDecoration}></div>
          <div style={styles.heroDecoration2}></div>

          <div style={styles.heroContainer}>
            <div
              style={{
                ...animations.fadeInUp,
                ...(animateHero ? animations.fadeInUpActive : {}),
                transitionDelay: '0.1s', // Slight delay after load
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={styles.heroPillBadge}>✨ New AI Features</span>
                <Title level={1} style={{
                  marginBottom: '28px',
                  fontWeight: 800,
                  fontSize: '52px',
                  lineHeight: '1.2',
                  background: 'linear-gradient(90deg, #4299E1 0%, #5A67D8 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textFillColor: 'transparent',
                  display: 'inline-block',
                  letterSpacing: '-0.5px',
                  position: 'relative',
                }}>
                  Streamline Your Meetings & Commissions
                  <span style={{ // Accent underline
                    position: 'absolute',
                    bottom: '-4px',
                    left: '25%',
                    width: '50%',
                    height: '4px',
                    background: 'linear-gradient(90deg, #4299E1, #5A67D8)', // Gradient underline
                    borderRadius: '2px',
                    opacity: 0.8,
                  }}></span>
                </Title>
                <Paragraph style={{
                  fontSize: '18px',
                  color: '#596577',
                  maxWidth: '700px',
                  margin: '0 auto 50px auto',
                  lineHeight: 1.7,
                }}>
                  Effortlessly manage commissions, schedule meetings, and automatically generate minutes with the power of AI. Save time, improve accuracy, and focus on what matters most.
                </Paragraph>
              </div>

              <Row gutter={[32, 32]} justify="center" style={{ marginBottom: '60px' }}>
                {stats.map((stat, index) => (
                  <Col key={index} xs={24} sm={8}>
                    <div
                      style={{
                        ...styles.statCardBase,
                        ...animations.scaleIn,
                        transitionDelay: `${index * 0.1 + 0.3}s`, // Stagger animation
                        ...(animateHero ? animations.scaleInActive : {}),
                        position: 'relative', // Required for perspective/transform
                        perspective: '1000px', // Define perspective for 3D tilt
                      }}
                      onMouseEnter={(e) => {
                         // Standard hover styles (lift and shadow)
                        Object.assign(e.currentTarget.style, styles.statCardHover);

                        // 3D tilt effect handler
                        const tiltHandler = (evt) => {
                          const card = e.currentTarget;
                          if (!card) return; // Exit if card is gone
                          const { left, top, width, height } = card.getBoundingClientRect();
                          const x = (evt.clientX - left) / width; // 0 to 1
                          const y = (evt.clientY - top) / height; // 0 to 1

                          const tiltX = (y - 0.5) * -15; // Vertical tilt (inverted, adjust multiplier for intensity)
                          const tiltY = (x - 0.5) * 15; // Horizontal tilt (adjust multiplier for intensity)

                          // Apply transform with perspective, rotation, lift, and scale
                          card.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-6px) scale(1.03)`;
                        };

                        // Add event listener for mouse movement
                        e.currentTarget.addEventListener('mousemove', tiltHandler);
                        // Store the handler reference for removal on leave
                        e.currentTarget._tiltHandler = tiltHandler;
                      }}
                      onMouseLeave={(e) => {
                         // Reset transform to base state smoothly
                        e.currentTarget.style.transform = styles.statCardBase.transform;
                         // Apply base shadow etc.
                        Object.assign(e.currentTarget.style, styles.statCardBase);

                        // Remove the specific mousemove listener
                        if (e.currentTarget._tiltHandler) {
                          e.currentTarget.removeEventListener('mousemove', e.currentTarget._tiltHandler);
                          delete e.currentTarget._tiltHandler; // Clean up property
                        }
                      }}
                    >
                      <Avatar
                        size={60}
                        style={{
                          backgroundColor: hexToRgba('#1890ff', 0.1), // Use helper
                          color: '#1890ff',
                          marginBottom: '20px',
                          display: 'inline-flex', // Use inline-flex for centering avatar content
                          justifyContent: 'center',
                          alignItems: 'center',
                          boxShadow: '0 8px 20px rgba(24,144,255,0.15)',
                          fontSize: '24px', // Icon size
                        }}
                      >
                        {stat.icon}
                      </Avatar>
                      <div style={styles.statNumber}>{stat.number}</div>
                      <Text strong style={{ color: '#596577', fontSize: '17px' }}>{stat.label}</Text>
                    </div>
                  </Col>
                ))}
              </Row>

              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary" // Already primary
                  size="large"
                  icon={<RocketOutlined style={{ fontSize: '18px' }} />}
                  onClick={handleGetStartedClick}
                  style={styles.heroButtonBase} // Base styles
                  onMouseEnter={(e) => handleMouseEnter(e, 'heroButton')}
                  onMouseLeave={(e) => handleMouseLeave(e, 'heroButton')}
                >
                  Get Started Now
                </Button>
                <Paragraph style={{
                  color: '#8c8c8c',
                  fontSize: '14px',
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px', // Use gap for spacing
                }}>
                  <LockOutlined style={{ fontSize: '12px' }} />
                  Secure, encrypted platform • No credit card required
                </Paragraph>
              </div>
            </div>
          </div>
        </div>

        {/* --- Features Section --- */}
        <div
          id="features-section"
          style={styles.featuresSection}
        >
          <div style={styles.featuresContainer}>
            <div
              style={{
                ...animations.fadeInUp,
                ...(animateFeatures ? animations.fadeInUpActive : {}),
                textAlign: 'center',
                marginBottom: '70px'
              }}
            >
              <span style={styles.pillBadge}>POWERFUL FEATURES</span>
              <Title level={2} style={{
                marginBottom: '20px',
                fontSize: '36px',
                fontWeight: 700,
                letterSpacing: '-0.5px',
                color: '#1f2937' // Darker title color for contrast
              }}>
                Everything You Need In One Platform
              </Title>
              <Paragraph style={{
                fontSize: '17px',
                color: '#596577',
                maxWidth: '700px',
                margin: '0 auto',
                lineHeight: '1.7',
              }}>
                Our all-in-one solution combines powerful commission management with AI-driven meeting tools.
              </Paragraph>
            </div>

            <Row gutter={[40, 40]} justify="center">
              {[
                {
                  icon: <TeamOutlined style={{ ...styles.featureIcon, color: '#4299E1' }} />,
                  title: "Gestion des Commissions",
                  description: "Track, manage, and report on commissions efficiently. Simplify complex calculations and ensure transparency.",
                  delay: 0.1,
                  animation: "fadeInLeft",
                  color: '#4299E1',
                },
                {
                  icon: <ScheduleOutlined style={{ ...styles.featureIcon, color: '#38A169' }} />,
                  title: "Planification des Réunions",
                  description: "Schedule meetings seamlessly, invite participants, and keep track of upcoming and past events.",
                  delay: 0.2,
                  animation: "fadeInUp",
                  color: '#38A169',
                },
                {
                  icon: <RobotOutlined style={{ ...styles.featureIcon, color: '#5A67D8' }} />,
                  title: "Génération des PV Automatisée (IA)",
                  description: "Leverage AI to automatically generate accurate meeting minutes (PVs), saving you valuable time.",
                  delay: 0.3,
                  animation: "fadeInRight",
                  color: '#5A67D8',
                }
              ].map((feature, index) => (
                <Col key={index} xs={24} sm={12} md={8}>
                  <div
                    style={{
                      // Apply base animation style
                      ...(feature.animation === "fadeInLeft" ? animations.fadeInLeft :
                         feature.animation === "fadeInRight" ? animations.fadeInRight :
                         animations.fadeInUp),
                      // Apply active animation style when triggered
                      ...(animateFeatures ?
                         (feature.animation === "fadeInLeft" ? animations.fadeInLeftActive :
                         feature.animation === "fadeInRight" ? animations.fadeInRightActive :
                         animations.fadeInUpActive) : {}),
                      transitionDelay: `${feature.delay}s`, // Corrected template literal
                      height: '100%', // Ensure div takes full height for card
                    }}
                  >
                    <Card
                      hoverable
                      style={styles.featureCard}
                      bodyStyle={styles.featureCardBody} // Apply body style
                      onMouseEnter={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(-8px)';
                        // Use helper function for RGBA conversion
                        const borderColor = hexToRgba(feature.color, 0.3); // Softer border color
                        card.style.boxShadow = `0 18px 40px rgba(0,0,0,0.08), 0 0 0 2px ${borderColor}`; // Add colored border shadow
                      }}
                      onMouseLeave={(e) => {
                        const card = e.currentTarget;
                        card.style.transform = 'translateY(0)';
                        card.style.boxShadow = '0 10px 40px rgba(0,0,0,0.04)'; // Reset to base shadow
                      }}
                    >
                      <div style={styles.iconWrapper}>
                        <Avatar
                          shape="square"
                          size={80}
                          style={{
                            // Use helper function for RGBA conversion
                            backgroundColor: hexToRgba(feature.color, 0.08),
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '20px',
                            boxShadow: `0 12px 24px ${hexToRgba(feature.color, 0.15)}`,
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                      </div>
                      {/* Wrap Meta in a div to control flex grow */}
                      <div style={{ flexGrow: 1 }}>
                        <Card.Meta
                          title={<Title level={3} style={{
                            marginBottom: '18px',
                            fontSize: '24px',
                            fontWeight: 600,
                            color: feature.color, // Custom color matching icon
                            minHeight: '56px', // Ensure titles align if they wrap to 2 lines
                          }}>{feature.title}</Title>}
                          description={
                            <Paragraph style={{
                              color: '#596577',
                              fontSize: '16px',
                              lineHeight: '1.8',
                              marginBottom: '24px',
                            }}>
                              {feature.description}
                            </Paragraph>
                          }
                        />
                      </div>
                      {/* Position Learn More at the bottom */}
                      <div style={{ marginTop: 'auto', paddingTop: '24px', textAlign: 'right' }}>
                        <Button
                          type="link"
                          className="learn-more-link" // Add class for potential global hover style
                          style={{
                            paddingRight: 0,
                            color: feature.color, // Match feature color
                            fontSize: '16px',
                            fontWeight: 500,
                            transition: 'opacity 0.3s ease', // Smooth hover effect
                          }}
                          icon={<ArrowRightOutlined />}
                        >
                          Learn More
                        </Button>
                      </div>
                    </Card>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </div>

        {/* --- AI Highlight Section --- */}
        <div id="ai-section" style={styles.aiHighlightSection}>
          <div style={styles.aiDecoration}></div> {/* Background Decoration */}
          <div style={styles.aiHighlightContainer}>
            <Row gutter={[64, 48]} align="middle"> {/* Increased gutter, vertical align */}
              {/* Text Content Column */}
              <Col xs={24} md={12} style={styles.aiHighlightTextCol}>
                <div style={{
                  ...animations.fadeInLeft,
                  ...(animateAI ? animations.fadeInLeftActive : {})
                }}>
                  <span style={{...styles.pillBadge, backgroundColor: hexToRgba('#52c41a', 0.1), color: '#52c41a' }}>AI POWERED</span>
                  <Title level={2} style={{
                      marginBottom: '24px',
                      fontSize: '36px',
                      fontWeight: 700,
                      letterSpacing: '-0.5px',
                      color: '#1f2937'
                  }}>
                      Automate Meeting Minutes with AI
                  </Title>
                  <Paragraph style={{
                      fontSize: '17px',
                      color: '#596577',
                      lineHeight: 1.7,
                      marginBottom: '30px',
                  }}>
                      Stop wasting time manually typing notes. Our intelligent AI automatically transcribes, summarizes, and formats your meeting minutes (PVs), ensuring accuracy and consistency.
                  </Paragraph>

                  <ul style={styles.benefitsList}>
                    {aiBenefits.map((benefit, index) => (
                      <li key={index}
                          className="benefit-item-hover" // Add class for hover effect
                          style={{
                              ...styles.benefitItem,
                              ...animations.fadeInUp,
                              ...(animateAI ? animations.fadeInUpActive : {}),
                              transitionDelay: `${index * 0.1 + 0.3}s`, // Staggered animation
                         }}>
                        <CheckCircleFilled style={styles.benefitIcon} />
                        <Text style={{ fontSize: '16px', color: '#374151' }}>{benefit}</Text>
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="primary"
                    style={{
                      ...styles.aiButtonBase,
                      marginTop: '10px', // Adjust spacing if needed
                    }}
                    icon={<RobotOutlined style={{ fontSize: '18px', marginRight: '8px' }} />}
                    onMouseEnter={(e) => handleMouseEnter(e, 'aiButton')}
                    onMouseLeave={(e) => handleMouseLeave(e, 'aiButton')}
                  >
                    Learn More about AI Features
                  </Button>
                </div>
              </Col>
              {/* Image/Visual Column */}
              <Col xs={24} md={12}>
                 <div style={{
                    ...animations.fadeInRight,
                    ...(animateAI ? animations.fadeInRightActive : {})
                 }}>
                  <div style={styles.aiHighlightImageContainer}>
                    <div style={styles.imageGlow}></div> {/* Pulsing Glow Effect */}
                    <Avatar
                      size={150} // Large Avatar
                      shape="circle"
                      style={{
                        backgroundColor: hexToRgba('#52c41a', 0.1), // Light green background
                        color: '#52c41a', // Green icon
                        fontSize: '70px', // Large icon
                        zIndex: 1, // Ensure icon is above glow
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 15px 40px rgba(82, 196, 26, 0.2)', // Subtle shadow
                        marginBottom: '30px',
                      }}
                      icon={<RobotOutlined />}
                    />
                    <Title level={4} style={{ color: '#1f2937', marginBottom: '10px' }}>Smart PV Generation</Title>
                    <Paragraph style={{ color: '#596577', maxWidth: '80%' }}>
                      Focus on the conversation, let AI handle the note-taking.
                    </Paragraph>
                  </div>
                 </div>
              </Col>
            </Row>
          </div>
        </div>

        {/* --- Call to Action (CTA) Section --- */}
        <div id="cta-section" style={styles.ctaSection}>
          <div style={styles.ctaDecoration}></div> {/* Background Decoration */}
          <div style={styles.ctaContainer}>
            <div style={{
                ...animations.fadeInUp,
                ...(animateCTA ? animations.fadeInUpActive : {})
            }}>
              <Title level={2} style={{
                  marginBottom: '24px',
                  fontSize: '38px', // Slightly larger
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: '#1f2937'
              }}>
                  Ready to Revolutionize Your Workflow?
              </Title>
              <Paragraph style={{
                  fontSize: '18px', // Larger text
                  color: '#596577',
                  lineHeight: 1.7,
                  marginBottom: '50px', // More spacing before button
              }}>
                  Join thousands of users streamlining their commissions and meetings with CommissionFlow AI. Get started today for free.
              </Paragraph>
              <Button
                type="primary" // Use primary style
                size="large"
                icon={<RocketOutlined style={{ fontSize: '18px' }} />}
                onClick={handleGetStartedClick}
                style={styles.ctaButtonBase} // Base styles
                onMouseEnter={(e) => handleMouseEnter(e, 'ctaButton')}
                onMouseLeave={(e) => handleMouseLeave(e, 'ctaButton')}
              >
                Start Your Free Trial
              </Button>
              <Paragraph style={{ color: '#8c8c8c', fontSize: '14px', marginTop: '20px' }}>
                No credit card required. Cancel anytime.
              </Paragraph>
            </div>
          </div>
        </div>

      </Content>

      {/* --- Footer --- */}
      <Footer style={styles.footer}>
          <div style={styles.logo} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Text style={{ ...styles.logoText, fontSize: '20px', color: hexToRgba('#FFFFFF', 0.8) }}>Commis</Text>
                <Text style={{ ...styles.logoText, fontSize: '20px', color: hexToRgba('#FFFFFF', 0.6) }}>sionFlow</Text>
                <Text style={{ ...styles.logoText, fontSize: '20px', color: hexToRgba('#FFFFFF', 0.7), marginLeft: '4px' }}>AI</Text>
             </div>
          </div>
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              ©{new Date().getFullYear()} CommissionFlow AI. All Rights Reserved.
          </Text>
          <Divider type="horizontal" style={{ borderColor: 'rgba(255, 255, 255, 0.2)', margin: '20px 0' }} />
          <Space size="large">
              <Button type="link" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Privacy Policy</Button>
              <Button type="link" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Terms of Service</Button>
              <Button type="link" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Contact Us</Button>
          </Space>
      </Footer>

      {/* --- Chatbot --- */}
      <div style={styles.chatbotContainer}>
        <Chatbot />
      </div>

    </Layout>
  );
}

export default Guest;