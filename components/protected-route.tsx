'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
 children: React.ReactNode;
 requiredRole?: 'admin' | 'customer';
}

export function ProtectedRoute({ children, requiredRole = 'customer' }: ProtectedRouteProps) {
 const { user, loading, userRole } = useAuth();
 const router = useRouter();

 useEffect(() => {
 if (loading) return;

 // Redirect to login if not authenticated
 if (!user) {
 toast.error('Please log in to access this page');
 router.push('/auth/login');
 return;
 }

 // Check admin role if required
 if (requiredRole === 'admin' && userRole !== 'admin') {
 toast.error('You do not have admin access');
 router.push('/');
 return;
 }
 }, [user, loading, userRole, requiredRole, router]);

 if (loading) {
 return (
 <div className="flex items-center justify-center min-h-screen bg-gradient-dark">
 <div className="flex flex-col items-center gap-4">
 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
 <p className="text-foreground/70 text-sm">Loading...</p>
 </div>
 </div>
 );
 }

 if (!user) {
 return null;
 }

 if (requiredRole === 'admin' && userRole !== 'admin') {
 return null;
 }

 return <>{children}</>;
}
