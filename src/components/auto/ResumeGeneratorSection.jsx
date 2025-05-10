import React, { useState, useRef, useEffect } from 'react';
import {
  Button, Input, Spin, message, Alert, Typography, Card, Space, Progress, Divider, Row, Col, Badge, Tooltip, Statistic, Select, Steps, Empty
} from 'antd';
import {
  UploadOutlined, AudioOutlined, CopyOutlined, InfoCircleOutlined, FileTextOutlined, SolutionOutlined,
  LoadingOutlined, CheckCircleOutlined, DeleteOutlined, FilePdfOutlined, WarningOutlined, CalendarOutlined
} from '@ant-design/icons';
import api from '../../services/axios-client'; // Assuming you have this configured
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Keep for potential future table formatting

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

function ResumeGeneratorSection() { // Changed component name for clarity
  // --- State Declaration ---
  // File state
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileSizeMB, setFileSizeMB] = useState(0);

  // Meeting Selection State
  const [meetingsList, setMeetingsList] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(null); // Store the selected meeting ID
  const [isFetchingMeetings, setIsFetchingMeetings] = useState(false);
  const [fetchMeetingsError, setFetchMeetingsError] = useState('');

  // Stage 1 States (Transcription)
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState('');
  const [transcriptionError, setTranscriptionError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadProgress, setShowUploadProgress] = useState(false);

  // Stage 2 States (Summary Generation) - Renamed
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState(null); // Renamed state
  const [summaryError, setSummaryError] = useState('');           // Renamed state

  // Current step control
  const [currentStep, setCurrentStep] = useState(0); // 0: Select Meeting, 1: Upload Audio, 2: Transcribe, 3: Generate Summary

  const fileInputRef = useRef(null);

  // --- File Config (Same as before) ---
  const allowedExtensions = ['.webm', '.ogg', '.oga', '.mp3', '.wav', '.m4a', '.mp4', '.flac', '.aac', '.amr', '.wma', '.aiff', '.mkv'];
  const maxSize = 50 * 1024 * 1024;
  const maxSizeMB = maxSize / 1024 / 1024;

  // --- Fetch Meetings on Mount ---
  useEffect(() => {
    const fetchMeetings = async () => {
      setIsFetchingMeetings(true);
      setFetchMeetingsError('');
      try {
        console.log("[MeetingSummary] Fetching meetings from /api/meetings");
        const response = await api.get('/meetings'); // Use your actual API endpoint for meetings
        if (response.data && Array.isArray(response.data)) {
          // Sort meetings by date, newest first (optional but helpful)
           const sortedMeetings = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
          setMeetingsList(sortedMeetings);
          console.log("[MeetingSummary] Meetings fetched:", response.data.length);
        } else {
          throw new Error("Invalid response format for meetings list.");
        }
      } catch (err) {
        console.error("[MeetingSummary] Error fetching meetings:", err);
        const errorMsg = extractErrorMessage(err, "Failed to fetch meetings");
        setFetchMeetingsError(errorMsg);
        message.error(errorMsg, 5);
      } finally {
        setIsFetchingMeetings(false);
      }
    };

    fetchMeetings();
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- File Upload Logic ---
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    // Don't reset all state here, just the file-specific parts and subsequent steps
    setSelectedFile(null);
    setFileSizeMB(0);
    setTranscriptionResult(null);
    setTranscriptionError('');
    setTranscriptionLanguage('');
    setGeneratedSummary(null);
    setSummaryError('');
    if (selectedMeetingId) setCurrentStep(1); // Go back to file upload step if meeting already selected

    if (file) {
      console.log('[MeetingSummary] Selected file:', { name: file.name, size: file.size, type: file.type });
      const currentFileSizeMB = file.size / 1024 / 1024;
      setFileSizeMB(currentFileSizeMB);

      const fileNameLower = file.name.toLowerCase();
      const fileExtension = '.' + fileNameLower.split('.').pop();
      const isExtensionAllowed = allowedExtensions.includes(fileExtension);

      if (file.size > maxSize) {
        const errorMsg = `File is too large (${currentFileSizeMB.toFixed(1)}MB). Max ${maxSizeMB}MB.`;
        message.error(errorMsg, 6);
        setTranscriptionError(errorMsg);
      } else if (!isExtensionAllowed && file.type.startsWith('audio/')) {
         message.warning(`File extension (${fileExtension}) might not be fully supported, but type (${file.type}) looks like audio. Proceeding...`, 5);
         setSelectedFile(file);
      } else if (!isExtensionAllowed) {
        const errorMsg = `File extension (${fileExtension}) is not supported. Allowed: ${allowedExtensions.join(', ')}`;
        message.error(errorMsg, 6);
        setTranscriptionError(errorMsg);
      } else {
        setSelectedFile(file);
        message.success(`Selected: ${file.name}`);
        if (selectedMeetingId) {
            // If meeting already selected, automatically enable transcribe button visually
            // No step change needed here, as setCurrentStep(1) was done above.
        }
      }
    } else {
      console.log('[MeetingSummary] File selection cancelled.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMeetingChange = (value) => {
    console.log(`[MeetingSummary] Selected Meeting ID: ${value}`);
    setSelectedMeetingId(value);
    if (value) {
        // Reset subsequent steps if meeting changes
        setSelectedFile(null);
        setFileSizeMB(0);
        setTranscriptionResult(null);
        setTranscriptionError('');
        setTranscriptionLanguage('');
        setGeneratedSummary(null);
        setSummaryError('');
        setCurrentStep(1); // Move to file upload step
    } else {
        resetAllStates(); // If meeting is deselected, reset everything
    }
  };

  const resetAllStates = () => {
    setSelectedFile(null);
    setFileSizeMB(0);
    setSelectedMeetingId(null); // Reset meeting selection
    // fetchMeetingsError doesn't need reset here, pertains to initial load

    setIsTranscribing(false);
    setTranscriptionResult(null);
    setTranscriptionLanguage('');
    setTranscriptionError('');
    setUploadProgress(0);
    setShowUploadProgress(false);

    setIsGeneratingSummary(false); // Renamed
    setGeneratedSummary(null);     // Renamed
    setSummaryError('');           // Renamed

    setCurrentStep(0); // Back to step 0
  };

  // --- Stage 1: Transcription (Mostly Unchanged) ---
  const handleTranscribe = async () => {
    if (!selectedFile || transcriptionError) {
      message.error(transcriptionError || 'Please select a valid audio file first.');
      return;
    }
    if (!selectedMeetingId) { // <<< Add check for meeting selection
       message.error('Please select the corresponding meeting first.');
       return;
    }

    setIsTranscribing(true);
    setTranscriptionError('');
    setTranscriptionResult(null);
    setTranscriptionLanguage('');
    setGeneratedSummary(null); // Clear previous summary result
    setSummaryError('');       // Clear previous summary error
    setShowUploadProgress(true);
    setUploadProgress(0);

    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += Math.random() * 5 + 1;
      if (currentProgress >= 98) {
        setUploadProgress(98);
        clearInterval(progressInterval);
      } else {
        setUploadProgress(Math.round(currentProgress));
      }
    }, 300);

    const formData = new FormData();
    formData.append('recording', selectedFile);
    const endpoint = '/transcribe-audio'; // Your transcription endpoint
    console.log(`[MeetingSummary] Calling Transcription Endpoint: ${endpoint}`);

    try {
      const response = await api.post(endpoint, formData, {
        timeout: 300000, // 5 minutes
        // onUploadProgress: ... (can keep if useful)
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const responseData = response.data;
      console.log("[MeetingSummary] Transcription Response:", responseData);

      if (responseData && typeof responseData.transcription === 'string') {
        setTranscriptionResult(responseData.transcription);
        setTranscriptionLanguage(responseData.language || 'N/A');
        setCurrentStep(2); // <<< Move to the transcription result step

        if (responseData.transcription === '') {
            message.info(responseData.message || 'Transcription complete, but no speech detected.', 5);
        } else {
            message.success(responseData.message || 'Transcription successful!');
        }
        setTimeout(() => setShowUploadProgress(false), 1500);
      } else {
        throw new Error(responseData?.message || 'Invalid transcription response format from server.');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setShowUploadProgress(false);
      console.error("[MeetingSummary] Transcription Error:", err);
      const displayError = extractErrorMessage(err, 'Transcription failed');
      setTranscriptionError(displayError);
      message.error(displayError, 6);
      setCurrentStep(1); // Stay on upload step if transcription fails
    } finally {
      setIsTranscribing(false);
      // Don't reset progress here, it might be useful to see 100% briefly
      // setUploadProgress(0);
    }
  };

  // --- Stage 2: Summary Generation (Modified) ---
  const handleGenerateSummary = async () => { // Renamed function
    // Check specifically if transcriptionResult is a non-empty string
    if (typeof transcriptionResult !== 'string' || transcriptionResult.trim() === '') {
      message.error('Transcription result is empty or not available. Cannot generate summary.', 5);
      return;
    }
    if (!selectedMeetingId) { // <<< Crucial check
       message.error('No meeting selected. Cannot generate summary.', 5);
       return;
    }
    if (summaryError) setSummaryError(''); // Clear previous summary errors


    setIsGeneratingSummary(true); // Renamed state setter
    setGeneratedSummary(null); // Renamed state setter

    const endpoint = '/generate-resume'; // <<< KEEP THIS as per your route definition
    console.log(`[MeetingSummary] Calling Summary Generation Endpoint: ${endpoint} for meeting ID: ${selectedMeetingId}`);

    try {
      // Send transcription text AND meeting_id in the request body
      const payload = {
        transcription: transcriptionResult,
        meeting_id: selectedMeetingId // <<< Add meeting ID here
      };
      console.log("[MeetingSummary] Payload for summary generation:", payload);

      const response = await api.post(endpoint,
        payload, // Send the JSON payload
        { timeout: 360000 } // 6 minutes
      );

      const responseData = response.data;
      console.log("[MeetingSummary] Summary Generation Response:", responseData);

      // Check for successful response and the 'summary' key (based on backend controller changes)
      if (responseData && typeof responseData.summary === 'string') { // <<< Check for 'summary' key
         if (responseData.summary.trim() === '') {
             message.warning(responseData.message || 'Summary generation finished, but the result was empty.', 5);
             setGeneratedSummary(''); // Renamed state setter
             // Still move to final step even if empty, to show the empty result
             setCurrentStep(3); // <<< Move to the final summary step
         } else {
             setGeneratedSummary(responseData.summary); // Renamed state setter
             setCurrentStep(3); // <<< Move to the final summary step
             message.success(responseData.message || 'Meeting Summary / PV generated successfully!'); // Updated message
         }
      } else {
         throw new Error(responseData?.message || 'Invalid summary response format from server.');
      }
    } catch (err) {
      console.error("[MeetingSummary] Summary Generation Error:", err);
      // Use the centralized error extractor
      const displayError = extractErrorMessage(err, 'Summary generation failed');
      setSummaryError(displayError); // Renamed state setter
      message.error(displayError, 6);
      setCurrentStep(2); // Stay on transcribe step if summary fails
    } finally {
      setIsGeneratingSummary(false); // Renamed state setter
    }
  };

  // --- Helper Functions (Mostly Unchanged, update PDF name) ---
  const triggerFileInput = () => {
    if (transcriptionError && !selectedFile) setTranscriptionError('');
    fileInputRef.current?.click();
  };

  const copyToClipboard = (textToCopy) => {
    if (!textToCopy) {
        message.warning('Nothing to copy.');
        return;
    }
    navigator.clipboard.writeText(textToCopy)
      .then(() => message.success('Copied to clipboard!'))
      .catch(err => {
        console.error('[MeetingSummary] Failed to copy:', err);
        message.error('Could not copy text.');
      });
  };

  const downloadPdf = (textToDownload, baseFilename) => {
     if (!textToDownload || (typeof textToDownload === 'string' && textToDownload.startsWith('['))) {
        message.warning('No valid text available to download.');
        return;
     }
     try {
       const doc = new jsPDF();
       doc.setFont('Helvetica', 'normal');
       doc.setFontSize(11);
       const lines = doc.splitTextToSize(textToDownload, 180);
       doc.text(lines, 15, 15);

       const selectedMeeting = meetingsList.find(m => m.id === selectedMeetingId);
       const meetingTitlePart = selectedMeeting ? selectedMeeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'meeting';
       const filename = `${baseFilename}_${meetingTitlePart}_${selectedFile?.name?.split('.').slice(0, -1).join('.') || 'generated'}.pdf`;

       doc.save(filename);
       message.success('PDF download started.');
     } catch (pdfError) {
       console.error("[MeetingSummary] Error generating PDF:", pdfError);
       message.error("Failed to generate PDF.");
     }
   };

   // Centralized error message extraction (Keep as is, it's generic)
   const extractErrorMessage = (err, defaultPrefix = "Processing failed") => {
    // ... (keep the existing robust error extraction logic) ...
     let displayError = `${defaultPrefix}: An unknown error occurred. Check console for details.`;

    if (err.code === 'ECONNABORTED') {
        displayError = `${defaultPrefix}: The request timed out. The server might be busy or the task is taking too long.`;
    } else if (err.response) {
        const responseData = err.response.data;
        const statusCode = err.response.status;

        if (responseData && responseData.message) {
            displayError = responseData.message;
            if (responseData.errors && typeof responseData.errors === 'object') {
                const validationErrors = Object.values(responseData.errors).flat().join(' ');
                if (validationErrors) {
                   // Check if message already contains details
                   if (!displayError.includes(validationErrors)) {
                       displayError += ` Details: ${validationErrors}`;
                   }
                }
            }
        } else {
            displayError = `${defaultPrefix}: Server responded with status ${statusCode}.`;
            if (statusCode === 500) displayError += " An internal server error occurred.";
            else if (statusCode === 503) displayError += " The service is temporarily unavailable.";
            else if (statusCode === 403) displayError += " You don't have permission for this action.";
            else if (statusCode === 404) displayError += " The requested endpoint was not found.";
            else if (statusCode === 422) displayError += " Invalid data submitted (check meeting ID and transcription)."; // Specific hint
             else if (statusCode === 400 && defaultPrefix.includes('Summary')) displayError = "Cannot generate summary, the transcription might be empty or unsuitable, or meeting ID missing/invalid."; // Specific for 400 on summary gen
             else if (typeof responseData === 'string' && responseData.length < 200) {
                displayError += ` Response: ${responseData}`;
            }
        }
    } else if (err.request) {
        displayError = `${defaultPrefix}: No response received from the server. It might be down or unreachable. Check your network connection.`;
    } else {
        if (err.message) {
           if (err.message.toLowerCase().includes('network error')) {
               displayError = `${defaultPrefix}: Network error. Please check your connection.`;
           } else {
              displayError = err.message;
           }
        }
    }
    return displayError;
   };


  // --- Derived State for UI Logic (Updated) ---
  const canTranscribe = selectedFile && selectedMeetingId && !isTranscribing && !isGeneratingSummary; // Added selectedMeetingId check
  // Generate summary enabled only if transcription is a NON-EMPTY string AND a meeting is selected
  const canGenerateSummary = typeof transcriptionResult === 'string' && transcriptionResult.trim().length > 0 && selectedMeetingId && !isGeneratingSummary && !isTranscribing;
  const showTranscriptionArea = typeof transcriptionResult === 'string' && !transcriptionError && currentStep >= 2;
  const showSummaryArea = typeof generatedSummary === 'string' && !summaryError && currentStep >= 3; // Renamed

  // Format meeting date for display in Select
  const formatMeetingDate = (dateString) => {
      try {
          const date = new Date(dateString);
          return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' +
                 date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
          return dateString; // Fallback
      }
  };

  // --- Render UI (Updated Labels, Added Select) ---
  return (
    <Card
      className="meeting-summary-generator"
      title={
        <Space align="center">
          <AudioOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Audio to Meeting Summary Generator</Title>
        </Space>
      }
      bordered
      style={{
        marginTop: '20px',
        boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
        borderRadius: '8px',
        overflow: 'hidden'
      }}
      extra={
        <Space>
           <Tooltip title="Uses local Whisper for transcription & Groq AI for summary generation">
             <InfoCircleOutlined style={{ fontSize: '16px', color: '#8c8c8c' }} />
           </Tooltip>
            <Button icon={<DeleteOutlined />} onClick={resetAllStates} danger size="small">
                Reset All
            </Button>
        </Space>
      }
    >
      {/* Process Steps */}
      <div style={{ margin: '0 0 24px' }}>
        <Steps
          current={currentStep}
          size="small"
          responsive
          items={[
            {
              title: 'Meeting',
              description: 'Select meeting',
              icon: selectedMeetingId ? <CheckCircleOutlined style={{ color: '#52c41a'}} /> : <CalendarOutlined />
            },
            {
              title: 'Audio',
              description: 'Upload file',
              icon: selectedFile ? <CheckCircleOutlined style={{ color: '#52c41a'}} /> : ( isTranscribing ? <LoadingOutlined /> : <UploadOutlined /> )
            },
            {
              title: 'Transcribe',
              description: 'Process audio',
              icon: currentStep >= 2 ? <CheckCircleOutlined style={{ color: '#52c41a'}} /> : (isTranscribing ? <LoadingOutlined /> : <FileTextOutlined />)
            },
            {
              title: 'Summary',
              description: 'Generate PV',
              icon: currentStep >= 3 ? <CheckCircleOutlined style={{ color: '#52c41a'}} /> : (isGeneratingSummary ? <LoadingOutlined /> : <SolutionOutlined />)
            },
          ]}
        />
      </div>

      {/* Step 0: Meeting Selection */}
      <div style={{ marginBottom: '24px' }}>
        <Card
          size="small"
          title={
            <Space>
              <CalendarOutlined style={{ color: currentStep === 0 ? '#1890ff' : (selectedMeetingId ? '#52c41a' : '#8c8c8c') }} />
              <Text strong>1. Select Meeting</Text>
            </Space>
          }
          style={{
            borderRadius: '6px',
            borderLeft: currentStep === 0 ? '3px solid #1890ff' : (selectedMeetingId ? '3px solid #52c41a' : '1px solid #f0f0f0')
          }}
        >
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Select
                showSearch
                style={{ width: '100%' }}
                placeholder={isFetchingMeetings ? "Loading meetings..." : "Select the meeting for this audio recording"}
                optionFilterProp="children"
                onChange={handleMeetingChange}
                value={selectedMeetingId}
                loading={isFetchingMeetings}
                disabled={isTranscribing || isGeneratingSummary || isFetchingMeetings}
                status={fetchMeetingsError ? 'error' : undefined}
                size="large"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {meetingsList.map(meeting => (
                  <Option key={meeting.id} value={meeting.id}>
                    {`${meeting.title} (${formatMeetingDate(meeting.date)}) - ${meeting.location}`}
                  </Option>
                ))}
              </Select>
              {fetchMeetingsError &&
                <Alert
                  message={fetchMeetingsError}
                  type="error"
                  showIcon
                  style={{marginTop: '12px'}}
                />
              }
            </Col>
          </Row>
        </Card>
      </div>

      {/* Step 1: File Selection & Transcribe Action */}
      <div style={{ marginBottom: '24px' }}>
        <Card
          size="small"
          title={
            <Space>
              <UploadOutlined style={{ color: currentStep === 1 ? '#1890ff' : (selectedFile ? '#52c41a' : '#8c8c8c') }} />
              <Text strong>2. Select Audio File & Transcribe</Text>
            </Space>
          }
          style={{
            borderRadius: '6px',
            borderLeft: currentStep === 1 ? '3px solid #1890ff' : (selectedFile ? '3px solid #52c41a' : '1px solid #f0f0f0'),
            opacity: selectedMeetingId ? 1 : 0.6 // Dim if no meeting selected
          }}
          extra={
             selectedFile && <Statistic
              title="File Size"
              value={fileSizeMB}
              precision={1}
              suffix="MB"
              valueStyle={{
                color: fileSizeMB > maxSizeMB ? '#cf1322' : '#3f8600',
                fontSize: '14px'
              }}
              style={{ display: 'inline-block', marginRight: '10px' }}
            />
          }
        >
          <input
            type="file"
            accept={allowedExtensions.join(',')}
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />

          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={16} md={18}>
              <Space align="start" style={{ width: '100%' }}>
                <Button
                  icon={<UploadOutlined />}
                  onClick={triggerFileInput}
                  disabled={isTranscribing || isGeneratingSummary || !selectedMeetingId}
                  size="middle" // Make slightly smaller
                  type={selectedFile ? "default" : "primary"}
                  style={{ marginRight: '12px' }}
                >
                  {selectedFile ? 'Change Audio' : 'Select Audio'}
                </Button>

                {selectedFile ? (
                  <Badge
                    count={
                      transcriptionError
                        ? <Tooltip title={transcriptionError}><WarningOutlined style={{ color: '#faad14' }} /></Tooltip>
                        : <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    }
                    offset={[-10, 10]}
                  >
                    <Text style={{ maxWidth: '250px', verticalAlign: 'middle' }} ellipsis>{selectedFile.name}</Text>
                  </Badge>
                ) : (
                  <Text type="secondary" style={{ verticalAlign: 'middle' }}>No file selected</Text>
                )}
              </Space>
            </Col>

            <Col xs={24} sm={8} md={6} style={{ textAlign: 'right' }}>
              <Button
                  type="primary"
                  icon={isTranscribing ? <LoadingOutlined /> : <FileTextOutlined />}
                  onClick={handleTranscribe}
                  disabled={!canTranscribe || !!transcriptionError}
                  loading={isTranscribing}
                  size="middle"
                >
                  Transcribe Audio
                </Button>
            </Col>
          </Row>

          <Row style={{ marginTop: '12px' }}>
            <Col span={24}>
              <Card size="small" style={{ background: '#f9fafb', borderRadius: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Supported Formats: <Text code style={{fontSize: '12px'}}>{allowedExtensions.join(', ')}</Text>
                    |   Max file size: {maxSizeMB} MB
                </Text>
              </Card>
            </Col>
          </Row>

          {showUploadProgress && isTranscribing && (
            <div style={{ marginTop: '16px' }}>
              <Progress
                percent={uploadProgress}
                status={uploadProgress === 100 ? 'success' : 'active'}
                strokeColor={{ from: '#108ee9', to: '#87d068' }}
                size="small"
              />
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: '12px', marginTop: '4px' }}>
                {uploadProgress < 100 ? 'Uploading and processing audio...' : 'Finalizing transcription...'}
              </Text>
            </div>
          )}

          {transcriptionError && !isTranscribing && ( // Only show error if not currently transcribing
            <Alert
              message="File or Transcription Error"
              description={transcriptionError}
              type="error"
              showIcon
              closable
              onClose={() => setTranscriptionError('')}
              style={{ marginTop: '16px' }}
            />
          )}
        </Card>
      </div>

      {/* Step 2: Transcription Result & Generate Action */}
      <div style={{ marginBottom: '24px' }}>
        <Card
          size="small"
          title={
            <Space>
              <FileTextOutlined style={{ color: currentStep >= 2 ? (transcriptionError ? '#cf1322' : '#1890ff') : '#8c8c8c' }} />
              <Text strong>3. Transcription Result</Text>
              {transcriptionLanguage && (
                <Text type="secondary" style={{fontSize: '0.9em'}}>
                  (Language: {transcriptionLanguage})
                </Text>
              )}
            </Space>
          }
          style={{
            borderRadius: '6px',
            borderLeft: currentStep === 2 ? '3px solid #1890ff' : (currentStep > 2 ? '3px solid #52c41a' : '1px solid #f0f0f0'),
            opacity: currentStep >= 2 || isTranscribing ? 1 : 0.6 // Dim if not reached
          }}
          extra={
            showTranscriptionArea && (
              <Space>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(transcriptionResult)}
                  size="small"
                  disabled={!transcriptionResult}
                >
                  Copy Text
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => downloadPdf(transcriptionResult, 'transcription')}
                  size="small"
                  disabled={!transcriptionResult}
                >
                  Download PDF
                </Button>
              </Space>
            )
          }
        >
          {isTranscribing && currentStep < 2 ? ( // Show spin only if actively transcribing for the first time
            <div style={{ padding: '30px', textAlign: 'center' }}>
              <Spin tip="Transcribing audio..." />
            </div>
          ) : currentStep >= 2 ? ( // Show results area if step 2 or beyond
                transcriptionError ? ( // If there was a transcription error (but we reached step 2 state somehow)
                   <Alert message="Transcription Failed" description={transcriptionError} type="error" showIcon />
                ) : transcriptionResult === '' ? (
                  <Alert
                    message="No Speech Detected"
                    description="The transcription is empty. No summary can be generated from this."
                    type="info"
                    showIcon
                  />
                ) : (
                  // Show Text Area and Generate Button
                  <div>
                    <TextArea
                      value={transcriptionResult}
                      onChange={(e) => {
                          setTranscriptionResult(e.target.value);
                          // If user edits, reset generated summary
                          setGeneratedSummary(null);
                          setSummaryError('');
                          if (currentStep > 2) setCurrentStep(2); // Back to generate step
                      }}
                      placeholder="Transcription text..."
                      autoSize={{ minRows: 6, maxRows: 12 }}
                      style={{
                        whiteSpace: 'pre-wrap',
                        background: '#fff',
                        border: '1px solid #d9d9d9',
                        borderRadius: '4px',
                        padding: '12px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        marginBottom: '16px'
                      }}
                    />
                    <div style={{ textAlign: 'right' }}>
                      <Button
                        type="primary"
                        icon={isGeneratingSummary ? <LoadingOutlined /> : <SolutionOutlined />}
                        onClick={handleGenerateSummary}
                        disabled={!canGenerateSummary}
                        loading={isGeneratingSummary}
                      >
                        Generate Summary / PV
                      </Button>
                    </div>
                  </div>
                )
          ) : ( // Default empty state before transcription finishes
            <Empty
              description={
                <Text type="secondary">
                  Transcription will appear here after processing
                </Text>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </div>

      {/* Step 3: Summary Result */}
      <div>
        <Card
          size="small"
          title={
            <Space>
              <SolutionOutlined style={{ color: currentStep >= 3 ? (summaryError ? '#cf1322' : '#1890ff') : '#8c8c8c' }} />
              <Text strong>4. Meeting Summary / PV</Text>
            </Space>
          }
          style={{
            borderRadius: '6px',
            borderLeft: currentStep === 3 ? '3px solid #1890ff' : '1px solid #f0f0f0',
            opacity: currentStep >= 3 || isGeneratingSummary ? 1 : 0.6 // Dim if not reached
          }}
          extra={
            showSummaryArea && (
              <Space>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => copyToClipboard(generatedSummary)}
                  type="primary"
                  size="small"
                  disabled={!generatedSummary}
                >
                  Copy Summary
                </Button>
                <Button
                  icon={<FilePdfOutlined />}
                  onClick={() => downloadPdf(generatedSummary, 'meeting_summary')}
                  size="small"
                  disabled={!generatedSummary}
                >
                  Download PDF
                </Button>
              </Space>
            )
          }
        >
          {isGeneratingSummary ? ( // Show spin while generating
            <div style={{textAlign: 'center', margin: '30px 0'}}>
              <Spin size="large" tip="Generating Meeting Summary... This may take a minute." />
            </div>
          ) : summaryError ? ( // Show error if generation failed
             <Alert
                message="Summary Generation Error"
                description={summaryError}
                type="error"
                showIcon
                closable
                onClose={() => setSummaryError('')}
                style={{ marginTop: '16px' }}
             />
          ) : showSummaryArea ? ( // Show summary if generated
            generatedSummary === '' ? ( // Handle explicitly empty summary
              <Alert
                message="Empty Summary Result"
                description="The AI generated an empty summary. This might happen if the transcription lacked relevant details or due to an issue with the generation process."
                type="warning"
                showIcon
              />
            ) : ( // Display the generated summary
              <TextArea
                readOnly
                value={generatedSummary} // Renamed state
                placeholder="Generated summary content..."
                autoSize={{ minRows: 10, maxRows: 25 }}
                style={{
                  whiteSpace: 'pre-wrap',
                  background: '#f9fafb', // Slightly off-white background
                  border: '1px solid #e8e8e8',
                  borderRadius: '4px',
                  padding: '15px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  fontFamily: "'SF Mono', Monaco, Menlo, Consolas, 'Courier New', monospace"
                }}
              />
            )
          ) : ( // Default empty state before summary generation
             <Empty
                description={
                  <Text type="secondary">
                    Generated summary will appear here after processing the transcription
                  </Text>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
             />
          )}
        </Card>
      </div>
    </Card>
  );
}

export default ResumeGeneratorSection;