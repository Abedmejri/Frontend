import { createBrowserRouter, Navigate, Outlet } from "react-router-dom"; 
import Dashboard from "./Dashboard.jsx";
import DefaultLayout from "./components/DefaultLayout.jsx"; 

import Login from "./views/Auth/Login.jsx";
import NotFound from "./views/NotFound.jsx";
import Signup from "./views/Auth/Signup.jsx";
import ForgotPassword from "./views/Auth/ForgotPassword.jsx";
import Users from "./components/user/Users.jsx";
import UserForm from "../src/components/user/UserForm.jsx";

import Guest from "./components/Guest/Guest.jsx"; 
import ResetPassword from "./views/Auth/ResetPassword.jsx";

import Commissions from "./components/Commssions/Commssions.jsx";
import PVs from "./components/Pv/PVs.jsx";
import Meetings from "./components/Meetings/Meetings.jsx";
import ResumeGeneratorSection from "./components/auto/ResumeGeneratorSection.jsx";
import SendEmail from "./components/Sendmails/SendEmail.jsx";
import Chatbot from "./components/Chatbot/Chatbot.jsx";
import UserCommissions from "./components/user_interfaces/UserCommsions.jsx";
import User_Schedule from "./components/user_interfaces/User_Schedule.jsx";


const router = createBrowserRouter([
 

  {
    path: "/",
    element: <Guest />, 
  },

  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPassword />,
  },

  
  {
    
    element: <DefaultLayout />,
    children: [
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/commissions",
        element: <Commissions />,
      },
      {
        path: "/pvs",
        element: <PVs />,
      },
      {
        path: "/meetings",
        element: <Meetings />,
      },
      {
        path: "/auto",
        element: <ResumeGeneratorSection />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/chatbot",
        element: <Chatbot />,
      },
      {
        path: '/send-email', 
        element: <SendEmail />
    },
    {
      path: '/user_commsion', 
        element: <UserCommissions />
    },
    {
      path: '/Schedule', 
        element: <User_Schedule />
    },
   
      {
        path: "/users/new",
        element: <UserForm key="userCreate" />,
      },
      {
        path: "/users/:id",
        element: <UserForm key="userUpdate" />,
      },
      // Optional: You might want a default redirect *if authenticated*
      // but trying to access a base path that doesn't exist within DefaultLayout.
      // Example: { path: "", element: <Navigate to="/dashboard" /> }
      // Or handle this logic within DefaultLayout itself.
    ],
  },

  // --- 4. Not Found Page ---
  // Catches any path that doesn't match the routes above.
  {
    path: "*",
    element: <NotFound />,
  },
]);

export default router;