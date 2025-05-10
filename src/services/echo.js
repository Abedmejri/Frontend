// src/services/echo.js
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosClient from '../services/axios-client'; // Assuming axiosClient handles base URL and credentials

window.Pusher = Pusher;

const PUSHER_APP_KEY = import.meta.env.VITE_PUSHER_APP_KEY; // Read from env
const PUSHER_APP_CLUSTER = import.meta.env.VITE_PUSHER_APP_CLUSTER; // Read from env

// --- ERROR CHECK for ENV variables ---
if (!PUSHER_APP_KEY || !PUSHER_APP_CLUSTER) {
    console.error("CRITICAL: Pusher environment variables (VITE_PUSHER_APP_KEY, VITE_PUSHER_APP_CLUSTER) are not set in your frontend environment!");
    // Optionally throw an error or display a message to the user
}

const echo = new Echo({
    broadcaster: 'pusher',
    key: PUSHER_APP_KEY,
    cluster: PUSHER_APP_CLUSTER,
    // wsHost: import.meta.env.VITE_PUSHER_HOST, // Only if using custom host like Soketi/Self-hosted
    // wsPort: import.meta.env.VITE_PUSHER_PORT, // Only if using custom host/port
    // wssPort: import.meta.env.VITE_PUSHER_PORT, // Only if using custom host/port
    forceTLS: (import.meta.env.VITE_PUSHER_SCHEME ?? 'https') === 'https', // Use TLS (wss) by default
    disableStats: true, // Optional: disable stats collection
    // encrypted: true, // Deprecated in newer pusher-js, use forceTLS

    // --- STANDARD AUTHENTICATION ---
    authEndpoint: '/broadcasting/auth', // Use Laravel's default auth endpoint

    // --- How Echo makes the auth request ---
    authorizer: (channel, options) => {
        return {
            authorize: async (socketId, callback) => {
                console.log(`[Auth] Requesting auth for channel: ${channel.name}, Socket ID: ${socketId}`);
                try {
                    // Use your configured axios instance which should handle
                    // the base URL and sending credentials (like Bearer token).
                    const response = await axiosClient.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    });
                    // Axios successful response (status 2xx)
                    console.log(`[Auth] Received auth response for ${channel.name}:`, response.data);
                    // Pass response data (which contains auth string and maybe channel_data) to Pusher
                    callback(false, response.data);
                } catch (error) {
                    // Axios request failed (status >= 300 or network error)
                    console.error(`[Auth] FAILED for channel ${channel.name}:`, error.response?.status, error.response?.data || error.message);
                    callback(true, error); // Pass error=true and the error object
                }
            }
        };
    },
});


// --- Optional: Connection Logging ---
echo.connector.pusher.connection.bind('state_change', (states) => {
    console.log("[Pusher] Connection state:", states.current);
});
echo.connector.pusher.connection.bind('error', (err) => {
    console.error("[Pusher] Connection Error:", err);
    if (err.error?.data?.code === 4004) {
        console.error("[Pusher] App key not found or invalid. Check VITE_PUSHER_APP_KEY.");
    } else if (err.error?.data?.code === 4001) {
         console.error("[Pusher] App is disabled or over quota.");
    }
});
// --- End Optional Logging ---

export default echo;