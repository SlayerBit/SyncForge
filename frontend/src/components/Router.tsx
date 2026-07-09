import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from './layout/AuthLayout'
import { AppLayout } from './layout/AppLayout'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

// Lazy loaded page components
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage'
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage'

import DashboardPage from '@/features/workspace/pages/DashboardPage'
import WorkspacePage from '@/features/workspace/pages/WorkspacePage'
import WorkspaceSettingsPage from '@/features/workspace/pages/WorkspaceSettingsPage'
import MembersPage from '@/features/workspace/pages/MembersPage'
import InvitationPage from '@/features/workspace/pages/InvitationPage'
import BoardPage from '@/features/board/pages/BoardPage'
import NotificationsPage from '@/features/notification/pages/NotificationsPage'
import UserSettingsPage from '@/features/settings/pages/UserSettingsPage'

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest / Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Invitation Landing Acceptance Route */}
        <Route path="/invitations/:token" element={<InvitationPage />} />

        {/* Protected Workspace Application Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<UserSettingsPage />} />
            <Route path="/workspaces/:workspaceId" element={<WorkspacePage />} />
            <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceSettingsPage />} />
            <Route path="/workspaces/:workspaceId/members" element={<MembersPage />} />
            <Route path="/boards/:boardId" element={<BoardPage />} />
          </Route>
        </Route>

        {/* Fallback boundary redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
export default Router
