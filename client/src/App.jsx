import {BrowserRouter, Navigate, Route, Routes} from "react-router-dom";

import {AuthProvider} from "./components/context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import Storage from "./pages/Storage";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import SharedResults from "./components/shared/SharedResults";
import SubscriptionSuccess from "./components/subscription/SubscriptionSuccess";
import SubscriptionCancel from "./components/subscription/SubscriptionCancel";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/home" element={<Home />} />

          <Route path="/upload" element={<Upload />} />

          <Route
            path="/storage"
            element={
              <ProtectedRoute>
                <Storage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/subscription/success"
            element={<SubscriptionSuccess />}
          />

          <Route path="/subscription/cancel" element={<SubscriptionCancel />} />

          <Route path="/share/:token" element={<SharedResults />} />

          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
