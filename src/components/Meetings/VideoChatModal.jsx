// src/VideoChatModal.jsx

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Modal, Button, Spin, Row, Col, Tooltip, message as antdMessage, Typography, Space, Layout, Empty, Tag } from 'antd';
import {
    AudioOutlined, AudioMutedOutlined, VideoCameraOutlined, StopOutlined, PhoneOutlined,
    LoadingOutlined, WarningOutlined, UserOutlined
} from '@ant-design/icons';

// --- IMPORT THE SEPARATE RESUME GENERATOR COMPONENT ---
// Adjust the path as necessary relative to this file
import ResumeGeneratorSection from '../auto/ResumeGeneratorSection';

const { Text } = Typography;
const { Content, Footer } = Layout;

// --- Configuration ---
// IMPORTANT: Add your actual STUN/TURN server configuration here for production reliability
const iceServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // { urls: "stun:global.stun.twilio.com:3478?transport=udp" },
        // Add TURN servers for production (e.g., using Twilio, Coturn, etc.)
        // {
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'your-username',
        //   credential: 'your-password'
        // },
    ],
    iceCandidatePoolSize: 10,
};

// --- Reusable Styles ---
const videoCardStyle = {
    position: 'relative', background: '#2d333b', // Darker background
    borderRadius: '8px', overflow: 'hidden', width: '100%',
    paddingTop: '75%', /* 4:3 Aspect Ratio */
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};
const videoElementBaseStyle = {
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    objectFit: 'cover', display: 'block', backgroundColor: '#22272e' // Even darker base
};
const localVideoStyle = { ...videoElementBaseStyle, transform: 'scaleX(-1)' }; // Mirror local video
const remoteVideoStyle = { ...videoElementBaseStyle };

const nameOverlayBaseStyle = {
    position: 'absolute', bottom: '8px', left: '8px',
    background: 'rgba(0, 0, 0, 0.6)', padding: '4px 10px',
    borderRadius: '12px', zIndex: 10,
    pointerEvents: 'none', display: 'inline-flex', alignItems: 'center',
};
const nameTextStyle = { color: '#e6edf3', fontSize: '0.85em' };
const statusIconStyle = { color: '#e6edf3', fontSize: '0.9em', marginLeft: '6px' };

const placeholderBaseStyle = {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)', color: 'rgba(255,255,255,0.8)', padding: '10px', textAlign: 'center'
};
const placeholderIconStyle = { fontSize: '2.5rem', marginBottom: '10px' };
const placeholderTextStyle = { fontSize: '0.8rem', color: 'rgba(255,255,255,0.9)' };

const modalBodyStyle = { padding: 0, background: '#f0f2f5', height: 'calc(85vh - 110px)', maxHeight: '700px' }; // Adjusted height, max height
const contentLayoutStyle = { background: '#f0f2f5', height: '100%', overflowY: 'auto' }; // Layout scrolls
const contentPaddingStyle = { padding: '20px' }; // Padding inside content
const footerStyle = {
    padding: '16px 20px', textAlign: 'center', background: '#ffffff',
    borderTop: '1px solid #f0f0f0', flexShrink: 0, boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.06)'
};

// --- Environment Variable Check ---
if (!import.meta.env.VITE_PUSHER_APP_KEY || !import.meta.env.VITE_PUSHER_APP_CLUSTER) {
     console.warn("Pusher environment variables (VITE_PUSHER_...) are not set! Real-time features may fail.");
}

// --- Main Component ---
const VideoChatModal = memo(({ visible, onClose, meeting, echo, currentUser }) => {
    // --- State ---
    const [isConnecting, setIsConnecting] = useState(true);
    const [mediaError, setMediaError] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    // Participants state stores: { id: { id, name, pc, stream, isAudioMuted?, isVideoMuted? } }
    const [participants, setParticipants] = useState({});
    const [isAudioMuted, setIsAudioMuted] = useState(false); // Local audio mute state
    const [isVideoMuted, setIsVideoMuted] = useState(false); // Local video mute state
    const [showResumeGenerator, setShowResumeGenerator] = useState(false);

    // --- Refs ---
    const localVideoRef = useRef(null);
    const presenceChannel = useRef(null);
    const participantVideoRefs = useRef({}); // Map: userId -> videoElementRef
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]); // Stores audio data Blob parts
    const isCleanupScheduledRef = useRef(false); // Prevents duplicate cleanup/downloads
    const isEffectActiveRef = useRef(false); // Track if effect is active (avoids state updates after unmount)

    // --- Constants ---
    const meetingChannelName = `presence-meeting.${meeting?.id}`;

    // --- Audio Recording Download Function ---
    const downloadRecording = useCallback(() => {
        const chunks = recordedChunksRef.current;
        // Ensure the modal hasn't been completely destroyed before trying to update state
        const canUpdateState = isEffectActiveRef.current || visible;

        if (chunks.length === 0) {
            console.log('[Recording] No audio chunks recorded, skipping download.');
            if (canUpdateState) setShowResumeGenerator(true);
            return;
        }

        console.log('[Recording] Preparing download...');
        try {
            // Determine best supported MIME type
            const supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
            const mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'audio/webm';
            const fileExtension = mimeType.startsWith('audio/ogg') ? 'ogg' : 'webm';

            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `meeting-audio-${meeting?.id || 'rec'}-${Date.now()}.${fileExtension}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            console.log(`[Recording] Download triggered as ${a.download}.`);
            antdMessage.success("Audio recording downloaded.", 3);
        } catch (error) {
            console.error('[Recording] Error creating or downloading blob:', error);
            antdMessage.error('Failed to prepare recording for download.');
        } finally {
            if (canUpdateState) setShowResumeGenerator(true); // Show resume section regardless of download success
            recordedChunksRef.current = []; // Clear chunks
        }
    }, [meeting?.id, visible]); // Include visible as proxy check

     // --- Cleanup Function ---
    const cleanupConnections = useCallback(() => {
        if (isCleanupScheduledRef.current) {
            console.log('[Cleanup] Skipping redundant cleanup call.');
            return;
        }
        isCleanupScheduledRef.current = true;
        console.log('[Cleanup] Initiating cleanup...');

        // 1. Stop Media Recorder (this triggers async onstop which calls downloadRecording)
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            console.log('[Cleanup] Stopping media recorder...');
            // Ensure onstop handles download and subsequent cleanup
            mediaRecorderRef.current.onstop = () => {
                console.log('[Recording] MediaRecorder stopped via cleanup.');
                downloadRecording(); // Will also set showResumeGenerator
                mediaRecorderRef.current = null; // Nullify ref after stop
            };
            mediaRecorderRef.current.onerror = (event) => {
                 console.error('[Recording] Error during recorder stop:', event.error);
                 downloadRecording(); // Still attempt download & show section
                 mediaRecorderRef.current = null;
            };
            try {
                 mediaRecorderRef.current.stop();
            } catch (e) {
                 console.error("[Cleanup] Error stopping MediaRecorder:", e);
                 downloadRecording(); // Force attempt if stop fails
                 mediaRecorderRef.current = null;
            }
        } else {
             console.log('[Cleanup] Media recorder not active or already stopped.');
             if (!mediaRecorderRef.current) { // If recorder wasn't even created or already nullified
                downloadRecording(); // Call it to handle chunk check & show resume section
             }
             mediaRecorderRef.current = null; // Ensure it's null
        }

        // 2. Stop local media tracks
        setLocalStream(currentLocalStream => {
            if (currentLocalStream) {
                console.log('[Cleanup] Stopping local stream tracks.');
                currentLocalStream.getTracks().forEach(track => track.stop());
            }
            return null; // Set state to null
        });

        // 3. Close all peer connections gracefully
        setParticipants(currentParticipants => {
            Object.values(currentParticipants).forEach(p => {
                if (p.pc) {
                    console.log(`[Cleanup] Closing peer connection for ${p.id}`);
                    // Remove listeners before closing
                    p.pc.onicecandidate = null;
                    p.pc.ontrack = null;
                    p.pc.oniceconnectionstatechange = null;
                    p.pc.onconnectionstatechange = null;
                    p.pc.close();
                }
            });
            return {}; // Reset participants state
        });

        // 4. Leave Echo channel
        if (presenceChannel.current) {
            console.log(`[Cleanup] Leaving Echo channel: ${meetingChannelName}`);
            // Unsubscribe from whispers
            presenceChannel.current.stopListeningForWhisper('offer');
            presenceChannel.current.stopListeningForWhisper('answer');
            presenceChannel.current.stopListeningForWhisper('candidate');
            // presenceChannel.current.stopListeningForWhisper('remoteTrackState'); // If implemented
            echo?.leave(meetingChannelName); // Use Echo's leave method
            presenceChannel.current = null;
        }

        // 5. Reset UI states (Leave showResumeGenerator as is)
        setIsConnecting(true);
        setMediaError(null);
        setIsAudioMuted(false);
        setIsVideoMuted(false);
        participantVideoRefs.current = {}; // Clear video refs map

        console.log('[Cleanup] Core cleanup finished.');
        // Reset flag after a delay to prevent immediate re-trigger if called rapidly
        setTimeout(() => { isCleanupScheduledRef.current = false; }, 500);

    }, [echo, meetingChannelName, downloadRecording]); // downloadRecording is stable

    // --- Function to Start Recording ---
    const startRecording = useCallback((stream) => {
        if (!stream) { console.warn('[Recording] Start cancelled: No stream.'); return; }
        if (mediaRecorderRef.current) { console.warn('[Recording] Start cancelled: Already recording.'); return; }

        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length === 0) {
            console.warn('[Recording] Cannot start: No audio tracks found.');
            antdMessage.warn("Cannot record audio: Microphone not available or permitted.", 5);
            return;
        }
        console.log('[Recording] Audio track found:', audioTracks[0].label || 'default');

        try {
            const supportedTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg'];
            let mimeType = supportedTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
            console.log(`[Recording] Using MIME type: ${mimeType || 'browser default'}`);
            const options = mimeType ? { mimeType } : {};
            // Create a NEW stream with only the audio tracks for the recorder
            const recorderStream = new MediaStream(stream.getAudioTracks());
            const recorder = new MediaRecorder(recorderStream, options);

            mediaRecorderRef.current = recorder; // Store instance
            recordedChunksRef.current = []; // Reset chunks array

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    // console.log(`[Recording] Data available: ${event.data.size} bytes`);
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.onstop = () => {
                console.log('[Recording] MediaRecorder stopped event fired.');
                // This handler is crucial for when stop() is called
                if (!isCleanupScheduledRef.current) { // Avoid duplicate call during cleanup
                   downloadRecording();
                }
                 mediaRecorderRef.current = null; // Nullify ref after stop completes
            };

            recorder.onerror = (event) => {
                console.error('[Recording] MediaRecorder error:', event.error);
                antdMessage.error(`Audio recording error: ${event.error?.name || 'Unknown error'}`);
                // Attempt cleanup/download even on error
                if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                    try { mediaRecorderRef.current.stop(); } catch (e) { /* ignore */ }
                } else if (!isCleanupScheduledRef.current) {
                     downloadRecording();
                }
                mediaRecorderRef.current = null;
            };

            recorder.start(1000); // Collect chunks every second (adjust interval if needed)
            console.log('[Recording] MediaRecorder started successfully. State:', recorder.state);
            antdMessage.info("Audio recording started.", 2);

        } catch (error) {
            console.error('[Recording] FATAL: Failed to create/start MediaRecorder:', error);
            antdMessage.error(`Could not start audio recording: ${error.message || 'Check console'}`);
            mediaRecorderRef.current = null; // Ensure ref is null on failure
        }
    }, [downloadRecording]); // Stable dependency

    // --- Main Effect for Initialization and Connection Management ---
    useEffect(() => {
        isEffectActiveRef.current = true; // Mark effect as active

        if (!visible) {
            // If modal is not visible, don't proceed with setup.
            // Cleanup is handled reliably by destroyOnClose + handleLeaveCall.
            return;
        }

        // --- Reset state when modal becomes visible ---
        console.log(`[Effect Init] Setting up for meeting ${meeting?.id}, user ${currentUser?.id}`);
        setIsConnecting(true);
        setMediaError(null);
        setShowResumeGenerator(false); // Hide resume section on new call start
        isCleanupScheduledRef.current = false; // Reset cleanup flag
        setParticipants({}); // Clear previous participants
        setLocalStream(null); // Clear previous stream


        // --- Guard Clause ---
        if (!echo || !currentUser || !meeting?.id) {
            console.warn(`[Effect] Prerequisites missing. Cannot initialize call. Echo: ${!!echo}, User: ${!!currentUser}, MeetingID: ${meeting?.id}`);
            setIsConnecting(false);
            setMediaError({ name: "ConfigError", message: "Missing required configuration or user data." });
            isEffectActiveRef.current = false; // Mark as inactive immediately
            return;
        }

        // --- WebRTC Helper Functions (Defined inside effect to capture current state/props) ---
        const createPeerConnection = (remoteUserId, streamToAddTracksFrom) => {
            if (!streamToAddTracksFrom) {
                 console.warn(`[WebRTC] Cannot create PC for ${remoteUserId}: local stream not ready.`);
                 return null;
            }
             console.log(`[WebRTC] Creating PC for connection to ${remoteUserId}`);
            try {
                const pc = new RTCPeerConnection(iceServers);

                // --- Event Handlers for the Peer Connection ---
                pc.onicecandidate = (event) => {
                    if (event.candidate && presenceChannel.current) {
                         // console.log(`[WebRTC] Sending ICE candidate to ${remoteUserId}`);
                        presenceChannel.current.whisper('candidate', {
                            senderId: currentUser.id,
                            recipientId: remoteUserId, // Target specific user
                            candidate: event.candidate,
                        });
                    }
                };

                // Inside createPeerConnection function...
pc.ontrack = (event) => {
    console.log(`[WebRTC] Received remote track from ${remoteUserId}`, event.track.kind);
    setParticipants(prev => { // Use functional update
        const existingParticipant = prev[remoteUserId];
        if (!existingParticipant) {
            console.warn(`[WebRTC] Received track for non-existent participant ${remoteUserId}. Ignoring.`);
            return prev; // Participant might have left (race condition)
        }

        // Ensure stream exists, create if not
        let updatedStream = existingParticipant.stream || new MediaStream();

        // IMPORTANT: Check if track is ALREADY in the stream before adding
        if (!updatedStream.getTracks().find(t => t.id === event.track.id)) {
            updatedStream.addTrack(event.track);
            console.log(`[WebRTC] Added ${event.track.kind} track ${event.track.id} to stream for ${remoteUserId}`);
        } else {
             console.log(`[WebRTC] Track ${event.track.id} already exists for ${remoteUserId}.`);
        }

        // Return the updated state including the stream
        return {
            ...prev,
            [remoteUserId]: { ...existingParticipant, stream: updatedStream }
        };
    });
};

                pc.oniceconnectionstatechange = () => {
                    console.log(`[WebRTC] ICE state change for ${remoteUserId}: ${pc.iceConnectionState}`);
                    if (['failed', 'disconnected', 'closed'].includes(pc.iceConnectionState)) {
                         console.warn(`[WebRTC] Connection to ${remoteUserId} is ${pc.iceConnectionState}. Consider cleanup/reconnect logic.`);
                         // Maybe update participant UI state here to show disconnected status
                          // setParticipants(prev => prev[remoteUserId] ? { ...prev, [remoteUserId]: { ...prev[remoteUserId], connectionState: pc.iceConnectionState } } : prev);
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log(`[WebRTC] Connection state change for ${remoteUserId}: ${pc.connectionState}`);
                    // Handle 'connected', 'disconnected', 'failed', 'closed'
                };

                // Add local tracks to the connection
                streamToAddTracksFrom.getTracks().forEach(track => {
                    try {
                         if (pc.getSenders().find(sender => sender.track === track)) {
                            // console.log(`[WebRTC] Track ${track.id} already added for ${remoteUserId}. Skipping.`);
                         } else {
                             pc.addTrack(track, streamToAddTracksFrom);
                            // console.log(`[WebRTC] Added local ${track.kind} track ${track.id} to PC for ${remoteUserId}`);
                         }
                    } catch (error) {
                         console.error(`[WebRTC] Error adding track ${track.id} for ${remoteUserId}:`, error);
                    }
                });

                return pc;

            } catch (error) {
                console.error(`[WebRTC] Error creating PeerConnection for ${remoteUserId}:`, error);
                antdMessage.error(`Failed to establish connection with ${remoteUserId}.`);
                return null;
            }
        };

        const sendOffer = async (pc, remoteUserId) => {
            if (!pc) return;
            try {
                console.log(`[WebRTC] Creating offer for ${remoteUserId}`);
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                if (presenceChannel.current) {
                    console.log(`[WebRTC] Whispering offer to ${remoteUserId}`);
                    presenceChannel.current.whisper('offer', {
                        senderId: currentUser.id,
                        recipientId: remoteUserId,
                        offer: pc.localDescription, // Send the SDP offer
                    });
                }
            } catch (error) {
                console.error(`[WebRTC] Error creating/sending offer to ${remoteUserId}:`, error);
            }
        };

        const handleOffer = async (senderId, offer, currentLocalStream) => {
             console.log(`[WebRTC] Received offer from ${senderId}`);
             let pc;
             // Use functional update to safely get current participants and update
             setParticipants(prev => {
                 const existing = prev[senderId];
                 if (existing?.pc) {
                     pc = existing.pc; // Use existing PC
                     console.log(`[WebRTC] Found existing PC for ${senderId} to handle offer.`);
                     return prev;
                 } else {
                     // Create PC if it doesn't exist when offer is received
                     console.log(`[WebRTC] No existing PC found for ${senderId}, creating new one.`);
                     const newPc = createPeerConnection(senderId, currentLocalStream);
                     if (newPc) {
                         pc = newPc;
                         // Return the new state including the participant with the new PC
                         return { ...prev, [senderId]: { id: senderId, name: `User ${senderId.substring(0,4)}`, pc: newPc, stream: null } };
                     }
                     console.error(`[WebRTC] Failed to create PC for sender ${senderId} upon receiving offer.`);
                     return prev; // Return previous state if PC creation failed
                 }
             });

             // Need a slight delay or alternative way to ensure 'pc' is set from the state update above
             // Using a check after potentially setting it:
             setTimeout(async () => {
                 const currentParticipant = participants[senderId]; // Re-fetch from potentially updated state
                 const currentPC = currentParticipant?.pc || pc; // Use pc from inner scope if state hasn't updated yet

                 if (!currentPC) {
                     console.error(`[WebRTC] Could not find or create PC for sender ${senderId} to handle offer (after timeout).`);
                     return;
                 }

                 try {
                     await currentPC.setRemoteDescription(new RTCSessionDescription(offer));
                     console.log(`[WebRTC] Creating answer for ${senderId}`);
                     const answer = await currentPC.createAnswer();
                     await currentPC.setLocalDescription(answer);

                     if (presenceChannel.current) {
                         console.log(`[WebRTC] Whispering answer to ${senderId}`);
                         presenceChannel.current.whisper('answer', {
                             senderId: currentUser.id,
                             recipientId: senderId,
                             answer: currentPC.localDescription, // Send the SDP answer
                         });
                     }
                 } catch (error) {
                     console.error(`[WebRTC] Error handling offer/creating answer for ${senderId}:`, error);
                 }
             }, 100); // Small delay to allow state to potentially update, adjust if needed

        };

        const handleAnswer = async (senderId, answer) => {
            console.log(`[WebRTC] Received answer from ${senderId}`);
             // Use functional update to access the latest state reliably
             setParticipants(prev => {
                 const participant = prev[senderId];
                 if (participant?.pc && participant.pc.signalingState === 'have-local-offer') { // Ensure state is correct
                     participant.pc.setRemoteDescription(new RTCSessionDescription(answer))
                         .then(() => console.log(`[WebRTC] Remote description (answer) set for ${senderId}`))
                         .catch(error => console.error(`[WebRTC] Error setting remote description (answer) for ${senderId}:`, error));
                 } else {
                      console.warn(`[WebRTC] Received answer from ${senderId}, but no matching participant/PC found or signaling state is not 'have-local-offer' (current state: ${participant?.pc?.signalingState}).`);
                 }
                 return prev; // Return unchanged state or the state after potential async update
             });
        };

        const handleIceCandidate = async (senderId, candidate) => {
            // Use functional update for safety, although less critical here than for answer/offer
            setParticipants(prev => {
                const participant = prev[senderId];
                if (participant?.pc && candidate && participant.pc.signalingState !== 'closed') {
                    participant.pc.addIceCandidate(new RTCIceCandidate(candidate))
                        .catch(error => {
                            if (error.name !== 'OperationError' && !error.message.includes("Cannot add ICE candidate")) { // Filter common benign errors
                               console.error(`[WebRTC] Error adding received ICE candidate for ${senderId}:`, error);
                            }
                        });
                }
                return prev; // Return unchanged state
            });
        };


        // --- Media Acquisition ---
        let acquiredStream = null;
        console.log("[Effect] Requesting media devices...");
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                if (!isEffectActiveRef.current) { stream.getTracks().forEach(t => t.stop()); return; } // Cleanup if effect became inactive
                console.log("[Effect] Local media acquired.");
                acquiredStream = stream;
                setLocalStream(stream); // Update state
                setMediaError(null); // Clear any previous media error
                if (localVideoRef.current) {
                     localVideoRef.current.srcObject = stream; // Assign to ref
                     localVideoRef.current.play().catch(e => console.warn("Local video play failed:", e.name));
                }
                startRecording(stream); // Start recording audio

                // --- Join Echo Presence Channel ---
                console.log(`[Effect] Joining Echo channel: ${meetingChannelName}`);
                try {
                    const channel = echo.join(meetingChannelName);
                    presenceChannel.current = channel; // Store channel instance

                    // --- Echo Event Bindings ---
                    channel.here((users) => {
                        if (!isEffectActiveRef.current || !acquiredStream) return;
                        console.log('[Echo] Joined. Users currently here:', users.map(u => u.id));
                        const initialParticipantsSetup = {};
                        users.forEach(user => {
                            if (user.id !== currentUser.id) { // Connect to everyone else
                                console.log(`[Echo] Setting up connection to existing user ${user.id}`);
                                const pc = createPeerConnection(user.id, acquiredStream);
                                if (pc) {
                                    // Add placeholder name immediately
                                    initialParticipantsSetup[user.id] = { id: user.id, name: user.name || `User ${user.id.substring(0, 4)}`, pc, stream: null };
                                    sendOffer(pc, user.id); // Initiate connection by sending offer
                                }
                            }
                        });
                        // Use functional update to merge initial participants
                        setParticipants(prev => ({ ...prev, ...initialParticipantsSetup }));
                        setIsConnecting(false); // Initial connection phase done
                    });

                    channel.joining((user) => {
                        if (!isEffectActiveRef.current || !acquiredStream || user.id === currentUser.id) return;
                        console.log(`[Echo] User joining: ${user.id}. Waiting for their offer.`);
                        // Prepare connection, but let the joining user send the initial offer
                        setParticipants(prev => {
                            if (prev[user.id]?.pc) { // Avoid recreating if already exists
                                console.log(`[Echo] PC for joining user ${user.id} already exists.`);
                                return prev;
                            }
                            const pc = createPeerConnection(user.id, acquiredStream);
                            // Add placeholder name immediately
                            return pc ? { ...prev, [user.id]: { id: user.id, name: user.name || `User ${user.id.substring(0, 4)}`, pc, stream: null } } : prev;
                        });
                    });

                    channel.leaving((user) => {
                        if (!isEffectActiveRef.current || user.id === currentUser.id) return;
                        console.log(`[Echo] User leaving: ${user.id}`);
                        setParticipants(prev => {
                            const leavingUser = prev[user.id];
                            if (leavingUser?.pc) {
                                console.log(`[WebRTC] Closing connection to leaving user ${user.id}`);
                                leavingUser.pc.close();
                            }
                            // Return new state object without the leaving user
                            const { [user.id]: _, ...rest } = prev;
                            return rest;
                        });
                        // Clean up video ref for the leaving user
                        delete participantVideoRefs.current[user.id];
                    });

                    // Listen for Whispers (Signaling)
                    channel.listenForWhisper('offer', (p) => { if (isEffectActiveRef.current && p.senderId !== currentUser.id) handleOffer(p.senderId, p.offer, acquiredStream) });
                    channel.listenForWhisper('answer', (p) => { if (isEffectActiveRef.current && p.senderId !== currentUser.id) handleAnswer(p.senderId, p.answer) });
                    channel.listenForWhisper('candidate', (p) => { if (isEffectActiveRef.current && p.senderId !== currentUser.id) handleIceCandidate(p.senderId, p.candidate) });
                    // channel.listenForWhisper('remoteTrackState', ...) // If implementing remote mute sync

                    // Handle Channel Errors
                    channel.error((error) => {
                        console.error(`[Echo] Channel Error on ${meetingChannelName}:`, error);
                        if (isEffectActiveRef.current) {
                            antdMessage.error('Real-time connection error. Please try rejoining.', 7);
                            setMediaError({ name: "ChannelError", message: "Connection to meeting server failed." });
                            // Consider auto-leaving on critical channel errors
                            // handleLeaveCall();
                        }
                    });

                } catch (error) {
                    console.error(`[Echo] Failed to join channel ${meetingChannelName}:`, error);
                    setIsConnecting(false);
                    setMediaError({ name: "ChannelJoinError", message: "Could not connect to the meeting channel." });
                }
            })
            .catch(error => {
                if (!isEffectActiveRef.current) return; // Check if effect is still active
                console.error("[Effect] Media Error:", error.name, error.message);
                antdMessage.error(`Media Device Error: ${error.name}. Check browser permissions.`, 7);
                setMediaError({ name: error.name, message: error.message });
                setLocalStream(null);
                setIsConnecting(false);
            });

        // --- Effect Cleanup ---
        return () => {
            console.log("[Effect Cleanup] Running effect cleanup function...");
            isEffectActiveRef.current = false; // Mark effect as inactive FIRST
            // Primary cleanup (stopping recorder, closing connections, leaving channel)
            // is handled by the cleanupConnections function. It's called reliably
            // by handleLeaveCall (triggered by onCancel/button) AND implicitly
            // by the Modal's destroyOnClose={true} prop.
            console.log("[Effect Cleanup] Finished effect cleanup function return.");
        };
    // Re-check dependencies: startRecording and cleanupConnections are stable due to useCallback
    // Participants state is used inside helpers, but they are defined within the effect's scope
    // so they always access the latest state when invoked via whispers/events.
    }, [visible, echo, currentUser, meeting?.id, meetingChannelName, cleanupConnections, startRecording]); // Removed 'participants' dependency


    // --- UI Control Handlers ---
    // Use the refined versions with logging from the previous step
    const toggleAudio = useCallback(() => {
        console.log('[Toggle Audio] Clicked. Current mute state:', isAudioMuted);
        if (!localStream) {
            console.warn('[Toggle Audio] Aborted: localStream is null.');
            antdMessage.warn("Local stream not available.");
            return;
        }
        const audioTracks = localStream.getAudioTracks();
        console.log(`[Toggle Audio] Found ${audioTracks.length} audio tracks.`);
        if (audioTracks.length === 0) {
            console.warn('[Toggle Audio] Aborted: No audio tracks found in the stream.');
            antdMessage.warn("Microphone track not found or is unavailable.");
            return;
        }
        const shouldEnable = isAudioMuted; // If currently muted, we should enable (unmute)
        console.log(`[Toggle Audio] Setting tracks enabled state to: ${shouldEnable}`);
        audioTracks.forEach(track => { track.enabled = shouldEnable; });
        const newMuteState = !shouldEnable;
        setIsAudioMuted(newMuteState);
        console.log(`[Toggle Audio] Updated component mute state to: ${newMuteState}`);
        // TODO: Whisper state change if needed
    }, [localStream, isAudioMuted]);

    const toggleVideo = useCallback(() => {
        console.log('[Toggle Video] Clicked. Current mute state:', isVideoMuted);
        if (!localStream) {
            console.warn('[Toggle Video] Aborted: localStream is null.');
            antdMessage.warn("Local stream not available.");
            return;
        }
        const videoTracks = localStream.getVideoTracks();
        console.log(`[Toggle Video] Found ${videoTracks.length} video tracks.`);
        if (videoTracks.length === 0) {
            console.warn('[Toggle Video] Aborted: No video tracks found in the stream.');
            antdMessage.warn("Camera track not found or is unavailable.");
            return;
        }
        const shouldEnable = isVideoMuted; // If currently muted, we should enable (unmute/start camera)
        console.log(`[Toggle Video] Setting tracks enabled state to: ${shouldEnable}`);
        videoTracks.forEach(track => { track.enabled = shouldEnable; });
        const newMuteState = !shouldEnable;
        setIsVideoMuted(newMuteState);
        console.log(`[Toggle Video] Updated component mute state to: ${newMuteState}`);
        // TODO: Whisper state change if needed
    }, [localStream, isVideoMuted]);

    // --- Leave Call Handler (Triggers Cleanup) ---
    const handleLeaveCall = useCallback(() => {
        console.log("[UI] User initiated leave call. Triggering cleanup...");
        cleanupConnections(); // Trigger cleanup immediately
        onClose(); // Then call the parent's onClose handler
    }, [onClose, cleanupConnections]);


    // --- Ref Management for Remote Videos ---
    const setVideoRef = useCallback((node, userId) => {
        // Assigns or removes the video element ref for a given participant
        if (node) {
            participantVideoRefs.current[userId] = node;
            // Attempt to assign stream immediately if available
            // Use functional state update to get latest participants
             setParticipants(prev => {
                 const participant = prev[userId];
                 if (participant?.stream && node.srcObject !== participant.stream) {
                     node.srcObject = participant.stream;
                     node.play().catch(e => console.warn(`Remote play (initial assign) failed for ${userId}:`, e.name));
                 }
                 return prev; // Return previous state, no actual state change needed here
             });
        } else {
            delete participantVideoRefs.current[userId];
        }
    }, []); // No dependency on participants needed here

    // --- Effect to Update Remote Video Streams When State Changes ---
    useEffect(() => {
        // console.log('[Stream Update Effect] Running. Participants:', participants);
        Object.entries(participants).forEach(([userId, participant]) => {
            const videoElement = participantVideoRefs.current[userId];
            if (videoElement) {
                 // Assign stream if it exists and isn't already assigned
                 if (participant.stream && videoElement.srcObject !== participant.stream) {
                     console.log(`[Stream Update] Assigning remote stream for ${userId} to video element.`);
                     videoElement.srcObject = participant.stream;
                     // Attempt to play. Muted attribute is usually handled by browser policies for autoplay.
                     videoElement.play().catch(e => console.warn(`Remote video play failed for ${userId}:`, e.name, e.message));
                 }
                 // Clear srcObject if stream is gone (e.g., user left)
                 else if (!participant.stream && videoElement.srcObject) {
                     console.log(`[Stream Update] Clearing remote stream for ${userId}.`);
                     videoElement.srcObject = null;
                 }
            } else {
                // console.log(`[Stream Update] No video element ref found for userId: ${userId}`);
            }
        });
    }, [participants]); // Correct dependency // Rerun whenever participants object changes


    // --- Rendering Logic ---
    const participantIds = Object.keys(participants);
    const hasAudioTrack = localStream?.getAudioTracks().length > 0;
    const hasVideoTrack = localStream?.getVideoTracks().length > 0;

    // Helper for local video placeholder content
    const getLocalVideoPlaceholder = () => {
        if (isConnecting && !localStream && !mediaError) return <><LoadingOutlined style={placeholderIconStyle} /><Text style={placeholderTextStyle}>Connecting...</Text></>;
        if (mediaError) return <><WarningOutlined style={{ ...placeholderIconStyle, color: '#ff7875' }} /><Text style={placeholderTextStyle}>Error: {mediaError.name}</Text></>;
        // Prioritize Camera Off/Muted message over generic "No Stream"
        if (isVideoMuted) return <><UserOutlined style={placeholderIconStyle} /><Text style={placeholderTextStyle}>Camera Muted</Text></>;
        if (!localStream || !hasVideoTrack) return <><UserOutlined style={placeholderIconStyle} /><Text style={placeholderTextStyle}>Camera Off / No Device</Text></>;
        // If stream exists but video isn't playing yet (rare case)
        return <><LoadingOutlined style={placeholderIconStyle} /><Text style={placeholderTextStyle}>Loading Video...</Text></>;
    };

    // Helper for remote video placeholder
    const getRemoteVideoPlaceholder = (userId) => {
         // Could add more specific states based on participant connection state if tracked
         return <div style={placeholderBaseStyle}><LoadingOutlined style={placeholderIconStyle} /><Text style={placeholderTextStyle}>Connecting to {participants[userId]?.name || 'user'}...</Text></div>;
    };

    // --- RENDER ---
    return (
        <Modal
            title={meeting ? `Video Call: ${meeting.title}` : 'Video Call'}
            open={visible}
            onCancel={handleLeaveCall} // Use unified leave handler for X button
            footer={null} // Custom footer below
            width="95vw" // More responsive width
            style={{ top: 20, maxWidth: '1600px' }} // Limit maximum width
            bodyStyle={modalBodyStyle}
            destroyOnClose={true} // Ensures cleanup on any close action
            maskClosable={false} // Prevent closing by clicking outside
        >
            <Layout style={contentLayoutStyle}>
                {/* Main Video Grid Area */}
                <Content style={contentPaddingStyle}>
                    {/* Initial Loading Spinner */}
                    {(isConnecting && !mediaError && !localStream) ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Spin size="large" tip="Initializing call and devices..." />
                        </div>
                    ) : (
                        <Row gutter={[20, 20]}> {/* Grid for video participants */}
                            {/* Local Video Card */}
                            <Col xs={24} sm={12} md={8} lg={6} xl={4} key="local_user_video">
                                <div style={videoCardStyle}>
                                    {(localStream && hasVideoTrack && !isVideoMuted) ? (
                                        <video ref={localVideoRef} autoPlay playsInline muted style={localVideoStyle} />
                                    ) : (
                                        <div style={placeholderBaseStyle}>{getLocalVideoPlaceholder()}</div>
                                    )}
                                    {/* Name & Status Overlay */}
                                    <div style={nameOverlayBaseStyle} title={currentUser?.name || 'You'}>
                                        <Text style={nameTextStyle} ellipsis>{currentUser?.name || 'You'} (Local)</Text>
                                        {isAudioMuted || !hasAudioTrack ? <AudioMutedOutlined style={{ ...statusIconStyle, color: '#ff7875' }} /> : <AudioOutlined style={statusIconStyle} />}
                                        {isVideoMuted || !hasVideoTrack ? <StopOutlined style={{ ...statusIconStyle, color: '#ff7875' }} /> : <VideoCameraOutlined style={statusIconStyle} />}
                                    </div>
                                </div>
                            </Col>

                            {/* Remote Participant Video Cards */}
                            {participantIds.map(userId => (
                                <Col xs={24} sm={12} md={8} lg={6} xl={4} key={userId}>
                                    <div style={videoCardStyle}>
                                        <video autoPlay playsInline style={remoteVideoStyle} ref={node => setVideoRef(node, userId)} />
                                        {/* Show placeholder until stream arrives */}
                                        {!participants[userId]?.stream && getRemoteVideoPlaceholder(userId)}
                                        {/* Name Overlay (Add remote status icons if implemented) */}
                                        <div style={nameOverlayBaseStyle} title={participants[userId]?.name || `User ${userId.substring(0,4)}`}>
                                            <Text style={nameTextStyle} ellipsis>{participants[userId]?.name || `User ${userId.substring(0,4)}`}</Text>
                                            {/* Example: {participants[userId]?.isAudioMuted ? <AudioMutedOutlined/> : <AudioOutlined/>} */}
                                        </div>
                                    </div>
                                </Col>
                            ))}

                            {/* Empty State (When alone after connection) */}
                             {participantIds.length === 0 && !isConnecting && localStream && !mediaError && (
                                 <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', opacity: 0.7}}>
                                     <Empty description={<Text type="secondary">Waiting for others to join the call...</Text>} />
                                 </Col>
                            )}

                             {/* Error State (Media or Connection errors) */}
                             {!isConnecting && mediaError && (
                                <Col span={24} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                     <Empty
                                        image={<WarningOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />}
                                        description={
                                            <Space direction="vertical" align="center">
                                                 <Text strong style={{color: '#d4380d'}}>Call Failed to Initialize</Text>
                                                 <Text type="secondary">Error: {mediaError.message} ({mediaError.name}).</Text>
                                                 <Text type="secondary">Check browser permissions for camera/microphone and network connection.</Text>
                                            </Space>
                                        }
                                     />
                                </Col>
                             )}
                        </Row>
                    )}
                </Content>

                {/* Footer with Call Controls */}
                <Footer style={footerStyle}>
                     <Space size="large">
                        <Tooltip title={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}>
                            <Button shape="circle" icon={isAudioMuted ? <AudioMutedOutlined /> : <AudioOutlined />} onClick={toggleAudio} size="large" danger={isAudioMuted} disabled={!hasAudioTrack || !!mediaError} aria-label={isAudioMuted ? "Unmute Microphone" : "Mute Microphone"}/>
                        </Tooltip>
                        <Tooltip title={isVideoMuted ? "Start Camera" : "Stop Camera"}>
                            <Button shape="circle" icon={isVideoMuted ? <StopOutlined /> : <VideoCameraOutlined />} onClick={toggleVideo} size="large" danger={isVideoMuted} disabled={!hasVideoTrack || !!mediaError} aria-label={isVideoMuted ? "Start Camera" : "Stop Camera"} />
                        </Tooltip>
                        {/* Main Leave Button */}
                        <Tooltip title="Leave Call & Save Audio Recording">
                            <Button type="primary" danger shape="circle" icon={<PhoneOutlined style={{ transform: 'rotate(135deg)' }} />} onClick={handleLeaveCall} size="large" aria-label="Leave Call" />
                        </Tooltip>
                     </Space>
                     {/* Small info text about recording */}
                     <div style={{ marginTop: '10px', fontSize: '0.8em', color: '#888' }}>Audio is recorded locally. Download will start when you leave the call.</div>
                </Footer>
            </Layout>

            {/* --- Conditionally Render Resume Section Below Call UI --- */}
            {showResumeGenerator && (
                // This div appears within the Modal body's scrollable area but outside the main call Layout
                <div style={{ padding: '24px', background: '#ffffff', borderTop: '1px solid #f0f0f0' }}>
                     <Typography.Title level={4} style={{marginBottom: '16px'}}>Generate Meeting Resume</Typography.Title>
                    <ResumeGeneratorSection /> {/* Your Resume Generator Component */}
                </div>
            )}
        </Modal>
    );
});

export default VideoChatModal;