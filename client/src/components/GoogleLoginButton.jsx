import {useEffect, useState} from "react";
import {GoogleLogin} from "@react-oauth/google";

import api from "../services/api";

const GoogleLoginButton = () => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  // --------------------------------
  // CHECK AUTHENTICATION
  // --------------------------------

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await api.get("/auth/me");
        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.log(error.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // --------------------------------
  // GOOGLE LOGIN
  // --------------------------------

  const handleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);

      const response = await api.post("/auth/google", {
        credential: credentialResponse.credential,
      });

      if (response.data.success) {
        setUser(response.data.user);
        setShowLogin(false);
      }
    } catch (error) {
      console.error(
        "Google login failed:",
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // GOOGLE LOGIN ERROR
  // --------------------------------

  const handleError = () => {
    console.error("Google Login Failed");
  };

  // --------------------------------
  // LOGOUT
  // --------------------------------

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");

      setUser(null);
      setShowLogin(false);
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    }
  };

  // --------------------------------
  // LOADING
  // --------------------------------

  if (loading) {
    return (
      <div className="flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    );
  }

  // --------------------------------
  // LOGGED IN
  // --------------------------------

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm">
          {user.picture ? (
            <img
              src={user.picture}
              alt={user.name || "User"}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-40 truncate text-sm font-semibold text-slate-900">
              {user.name}
            </p>

            <p className="max-w-40 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Logout
        </button>
      </div>
    );
  }

  // --------------------------------
  // LOGGED OUT
  // --------------------------------

  return (
    <div className="relative">
      {!showLogin ? (
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.22a4.46 4.46 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.19Z"
            />

            <path
              fill="#34A853"
              d="M12 21.75c2.63 0 4.84-.87 6.45-2.34l-3.14-2.43c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.5A9.75 9.75 0 0 0 12 21.75Z"
            />

            <path
              fill="#FBBC05"
              d="M6.54 13.88A5.86 5.86 0 0 1 6.23 12c0-.65.11-1.28.31-1.88V7.62H3.3A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.38l3.24-2.5Z"
            />

            <path
              fill="#EA4335"
              d="M12 6.09c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.18 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.62l3.24 2.5C7.31 7.81 9.46 6.09 12 6.09Z"
            />
          </svg>
          Sign in with Google
        </button>
      ) : (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
          <div className="mb-4 text-center">
            <p className="text-sm font-semibold text-slate-900">
              Sign in to Imagify
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Continue with your Google account
            </p>
          </div>

          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
          </div>

          <button
            type="button"
            onClick={() => setShowLogin(false)}
            className="mt-4 w-full text-xs text-slate-400 transition hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
