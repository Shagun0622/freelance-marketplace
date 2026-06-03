import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import { NotificationProvider } from "./context/NotificationContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PostGig from "./pages/PostGig";
import BrowseGigs from "./pages/BrowseGigs";
import MyGigs from "./pages/Mygigs";
import EditGig from "./pages/Editgig";
import GigDetail from "./pages/GigDetail";
import GigProposals from "./pages/GigProposals";
import MyProposals from "./pages/MyProposals";
import Messages from "./pages/Messages";
import MyPayments from "./pages/MyPayments";
import MyEarnings from "./pages/MyEarnings";
import Layout from "./components/Layout";
import Profile from "./pages/Profile";
import OAuthSuccess from "./pages/OAuthSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DisputeCenter from "./pages/DisputeCenter";
import RaiseDispute from "./pages/RaiseDispute";
import DisputeDetail from "./pages/DisputeDetail";

// Protected route for pages that need Navbar (not Admin)
function NavbarRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;

  return <Layout>{children}</Layout>;
}

// Dashboard route (keeps original sidebar)
function DashboardRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (user.role === "admin") return <Navigate to="/admin" />;

  return children;
}

// Admin route - NO Layout wrapper
function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-[#0d9f6f]" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "admin") return <Navigate to="/dashboard" />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes - No Layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      {/* Profile - With Navbar */}
      <Route
        path="/profile"
        element={
          <NavbarRoute>
            <Profile />
          </NavbarRoute>
        }
      />

      {/* Admin Routes - NO Navbar */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />

      {/* Dashboard - Original Sidebar (no Navbar) */}
      <Route
        path="/dashboard"
        element={
          <DashboardRoute>
            <Dashboard />
          </DashboardRoute>
        }
      />

      {/* Other Pages - With Navbar */}
      <Route
        path="/browse-gigs"
        element={
          <NavbarRoute>
            <BrowseGigs />
          </NavbarRoute>
        }
      />
      <Route
        path="/gigs/:id"
        element={
          <NavbarRoute>
            <GigDetail />
          </NavbarRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <NavbarRoute>
            <Messages />
          </NavbarRoute>
        }
      />
      <Route
        path="/my-proposals"
        element={
          <NavbarRoute>
            <MyProposals />
          </NavbarRoute>
        }
      />
      <Route
        path="/post-gig"
        element={
          <NavbarRoute>
            <PostGig />
          </NavbarRoute>
        }
      />
      <Route
        path="/my-gigs"
        element={
          <NavbarRoute>
            <MyGigs />
          </NavbarRoute>
        }
      />
      <Route
        path="/edit-gig/:id"
        element={
          <NavbarRoute>
            <EditGig />
          </NavbarRoute>
        }
      />
      <Route
        path="/gigs/:id/proposals"
        element={
          <NavbarRoute>
            <GigProposals />
          </NavbarRoute>
        }
      />
      <Route
        path="/my-payments"
        element={
          <NavbarRoute>
            <MyPayments />
          </NavbarRoute>
        }
      />
      <Route
        path="/my-earnings"
        element={
          <NavbarRoute>
            <MyEarnings />
          </NavbarRoute>
        }
      />
      <Route
        path="/disputes"
        element={
          <NavbarRoute>
            <DisputeCenter />
          </NavbarRoute>
        }
      />
      <Route
        path="/disputes/:id"
        element={
          <NavbarRoute>
            <DisputeDetail />
          </NavbarRoute>
        }
      />
      <Route
        path="/raise-dispute"
        element={
          <NavbarRoute>
            <RaiseDispute />
          </NavbarRoute>
        }
      />
      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <NotificationProvider>
            <CurrencyProvider>
              <AppRoutes />
            </CurrencyProvider>
          </NotificationProvider>
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
