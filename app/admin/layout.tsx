'use client';

import { ProtectedRoute } from '@/components/protected-route';
import { AdminSidebar } from '@/components/admin/sidebar';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="flex h-screen bg-gradient-dark">
        <AdminSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-gradient-dark border-l border-white/10">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
