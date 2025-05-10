// axios-client.js (Corrected)

import axios from "axios";
// Importing useStateContext here is generally an anti-pattern for a plain JS module.
// You usually get the token directly from localStorage in the interceptor.
// If you need context actions (like setting token to null on 401), it requires
// a more complex setup (like passing context setters or using a different pattern).
// import { useStateContext } from "./context/ContextProvider.jsx";

const axiosClient = axios.create({
  baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
  withCredentials: true, // <--- UNCOMMENT THIS LINE
});

// Request Interceptor: Adds Auth token IF available
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN');
  if (token) { // <-- Only add header if token exists
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add console logs for debugging WHEN NEEDED:
  // console.log('Request Interceptor - Headers:', config.headers);
  return config;
});

// Response Interceptor: Handles common errors like 401
axiosClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    try { // Added try block for safer access to error.response
      const { response } = error;
      if (response) { // Check if response exists
         if (response.status === 401) {
          console.warn("Axios Interceptor: Received 401 Unauthorized. Removing token.");
          localStorage.removeItem('ACCESS_TOKEN');
          // IMPORTANT: This removes the token from storage, but doesn't update
          // your React context state directly. The app might still think the user
          // is logged in until a refresh or the next check. Your explicit logout
          // button handles this better by calling setToken(null).
          // Forcing a reload might be too disruptive:
          // window.location.reload();
          // Redirecting might be better if necessary:
          // window.location.href = '/login';
        } else if (response.status === 404) {
          console.error("Axios Interceptor: Received 404 Not Found.");
          // Show not found message to user if appropriate
        }
        // You could add more specific error handling here (e.g., for 403 Forbidden, 422 Validation Errors)
      } else {
         // Handle errors without a response (network errors, etc.)
         console.error("Axios Interceptor: Network or other error without response:", error);
      }
    } catch (e) {
       // Catch potential errors within the error handling logic itself
       console.error("Axios Interceptor: Error during error handling:", e);
    }


    // It's crucial to re-throw the error so that component-level .catch() blocks
    // can also handle it (e.g., to show specific error messages to the user).
    return Promise.reject(error);
  }
);

export default axiosClient;