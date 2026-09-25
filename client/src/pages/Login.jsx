import {useEffect, useState} from "react";
import {GoogleLogin} from "@react-oauth/google";
import {Link, useNavigate} from "react-router-dom";

import {useAuth} from "../components/context/AuthContext";
const Login = () => {
  const navigate = useNavigate();

  const {isAuthenticated, loading, loginWithGoogle} = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/home", {replace: true});
    }
  }, [loading, isAuthenticated, navigate]);

  const handleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError("Google login failed. Please try again.");
      return;
    }

    try {
      setGoogleLoading(true);
      setError("");

      const response = await loginWithGoogle(credentialResponse.credential);

      if (!response?.success) {
        setError(response?.message || "Google login failed. Please try again.");

        return;
      }

      navigate("/home", {replace: true});
    } catch (error) {
      console.error(
        "Google login failed:",
        error.response?.data || error.message,
      );

      setError(
        error.response?.data?.message ||
          "Google login failed. Please try again.",
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleError = () => {
    setError("Google login failed. Please try again.");
  };

  const handleGuest = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />

            <span className="text-sm font-medium text-slate-600">
              Checking your session...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/login" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              I
            </div>

            <span className="text-xl font-bold tracking-tight">Imagify</span>
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-xl font-bold text-white">
                I
              </div>

              <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
                Welcome to Imagify
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sign in to manage your images, storage and processing history.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {/* Google Login */}
            <div className="mt-8 flex justify-center">
              {googleLoading ? (
                <div className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />

                    <span className="text-sm font-medium text-slate-600">
                      Signing in...
                    </span>
                  </div>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={handleSuccess}
                  onError={handleError}
                  width="100%"
                />
              )}
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                or
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            {/* Guest */}
            <button
              type="button"
              onClick={handleGuest}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Continue as Guest
            </button>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Guest users can process images without creating an account.
              Storage requires authentication.
            </p>
          </div>

          {/* Bottom text */}
          <p className="mt-6 text-center text-xs text-slate-400">
            By continuing, you agree to use Imagify responsibly.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
