import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleListing from './pages/VehicleListing';
import VehicleDetails from './pages/VehicleDetails';
import BookingFlow from './pages/BookingFlow';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import BookingRequests from './pages/BookingRequests';
import VehicleManagement from './pages/VehicleManagement';
import AuditLogs from './pages/AuditLogs';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFail from './pages/PaymentFail';
import UploadReceipt from './pages/UploadReceipt';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { role, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="vehicles" element={<VehicleListing />} />
            <Route path="vehicles/:id" element={<VehicleDetails />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="payment/success" element={<PaymentSuccess />} />
            <Route path="payment/fail" element={<PaymentFail />} />
            <Route path="payment/receipt" element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SPECIAL_ADMIN']}>
                <UploadReceipt />
              </ProtectedRoute>
            } />

            {/* Customer Protected Routes */}
            <Route path="booking" element={
              <ProtectedRoute allowedRoles={['CUSTOMER']}>
                <BookingFlow />
              </ProtectedRoute>
            } />
            <Route path="profile" element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SPECIAL_ADMIN']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="profile/edit" element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'SPECIAL_ADMIN']}>
                <EditProfile />
              </ProtectedRoute>
            } />

            {/* Admin Protected Routes */}
            <Route path="admin" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SPECIAL_ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="bookings" element={<BookingRequests />} />
              <Route path="vehicles" element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <VehicleManagement />
                </ProtectedRoute>
              } />
              <Route path="logs" element={
                <ProtectedRoute allowedRoles={['SPECIAL_ADMIN']}>
                  <AuditLogs />
                </ProtectedRoute>
              } />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f172a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
