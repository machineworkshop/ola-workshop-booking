import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Book from "./pages/Book";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFD400]" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <ErrorBoundary>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/book" element={<Book />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/owner" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{ style: { background: "#141414", border: "1px solid #2A2A2A", color: "#fff" } }}
          />
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}

export default App;
