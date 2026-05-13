import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/HomePage';
import ExpertDetailPage from '../pages/ExpertDetailPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import UserDashboardPage from '../pages/UserDashboardPage';
import ExpertDashboardPage from '../pages/ExpertDashboardPage';
import MessagesPage from '../pages/MessagesPage';
import BecomeExpertPage from '../pages/BecomeExpertPage';
import ContactPage from '../pages/ContactPage';
import SettingsPage from '../pages/SettingsPage';
import ExpertSettingsPage from '../pages/ExpertSettingsPage';
import NotFoundPage from '../pages/NotFoundPage';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminExpertsPage from '../pages/admin/AdminExpertsPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';

const AppRoutes = () => (
  <Routes>
    <Route element={<MainLayout />}>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/experts/:id" element={<ExpertDetailPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Authenticated */}
      <Route element={<ProtectedRoute require="authenticated" />}>
        <Route path="/dashboard" element={<UserDashboardPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/become-expert" element={<BecomeExpertPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Approved experts only */}
      <Route element={<ProtectedRoute require="expert" />}>
        <Route path="/expert-dashboard" element={<ExpertDashboardPage />} />
        <Route path="/expert-settings" element={<ExpertSettingsPage />} />
      </Route>

      {/* Admin only — nested under AdminLayout */}
      <Route element={<ProtectedRoute require="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="applications" element={<AdminApplicationsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="experts" element={<AdminExpertsPage />} />
          <Route path="bookings" element={<AdminBookingsPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
