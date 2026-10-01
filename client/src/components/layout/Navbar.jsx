import {Link, useNavigate} from "react-router-dom";

import {useAuth} from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();

  const {isAuthenticated, loading, logout} = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", {
      replace: true,
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            I
          </div>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            Imagify
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/home" className="text-sm font-semibold text-slate-900">
            Home
          </Link>

          <Link
            to="/upload"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Upload
          </Link>

          {isAuthenticated && (
            <Link
              to="/storage"
              className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Storage
            </Link>
          )}

          <Link
            to="/subscription"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Pricing
          </Link>

          <a
            href="#features"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Features
          </a>

          <a
            href="#about"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            About
          </a>
        </nav>

        {/* Authentication */}
        <div className="flex items-center gap-3">
          {loading && (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-slate-100" />
          )}

          {!loading && !isAuthenticated && (
            <Link
              to="/login"
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Login
            </Link>
          )}

          {!loading && isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
