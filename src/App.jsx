import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AIChatbox from "./components/AIChatbox";
import ProtectedRoute from "./components/ProtectedRoute";
import Admin from "./screens/Admin";
import Dashboard from "./screens/Dashboard";
import Home from "./screens/Home";
import Login from "./screens/Login";
import ProductDetails from "./screens/ProductDetails";
import Profile from "./screens/Profile";
import Signup from "./screens/Signup";
import VirtualTryOn from "./screens/VirtualTryOn";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;

  if (token) {
    return <Navigate to={user?.role === "admin" ? "/admin" : "/dashboard"} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/product/:productId"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/try-on/:productId"
          element={
            <ProtectedRoute>
              <VirtualTryOn />
            </ProtectedRoute>
          }
        />
      </Routes>
      <AIChatbox />
    </BrowserRouter>
  );
}

export default App;
