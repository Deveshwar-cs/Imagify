import {Link, useNavigate} from "react-router-dom";

import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import {useAuth} from "../components/context/AuthContext";

const Home = () => {
  const navigate = useNavigate();

  const {isAuthenticated, loading, logout} = useAuth();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ============================================
          HEADER
      ============================================ */}
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

            {!loading && isAuthenticated && (
              <Link
                to="/storage"
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Storage
              </Link>
            )}

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

      {/* ============================================
          MAIN
      ============================================ */}
      <main>
        {/* ============================================
            HERO
        ============================================ */}
        <section className="relative overflow-hidden bg-white">
          {/* Background decoration */}
          <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-slate-100 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Powerful image processing
              </div>

              {/* Heading */}
              <h1 className="text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Transform your images.
                <span className="block text-slate-400">
                  Simple. Fast. Powerful.
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">
                Resize, compress, improve quality and upscale your images with a
                simple workflow built for speed and convenience.
              </p>

              {/* CTA */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/upload"
                  className="rounded-xl bg-slate-900 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl"
                >
                  Start Processing
                </Link>

                <a
                  href="#features"
                  className="rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Explore Features
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            FEATURES
        ============================================ */}
        <section
          id="features"
          className="border-t border-slate-200 bg-slate-50"
        >
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            {/* Section heading */}
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                Features
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Everything you need for better images.
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-500">
                Powerful image tools designed to keep your workflow simple and
                efficient.
              </p>
            </div>

            {/* Feature cards */}
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Resize */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                  ↔
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Resize
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Change image dimensions with custom width and height while
                  maintaining the aspect ratio.
                </p>
              </div>

              {/* Compress */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                  ◌
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Compress
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Reduce image file size with flexible compression levels while
                  keeping quality in mind.
                </p>
              </div>

              {/* Quality */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                  ✦
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Improve Quality
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Process your images to improve visual quality and create
                  cleaner results.
                </p>
              </div>

              {/* Upscale */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-lg">
                  ⤢
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Upscale
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Increase image resolution using 2× or 3× upscaling options.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            HOW IT WORKS
        ============================================ */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                Workflow
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Process your images in a few simple steps.
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
                Upload your images, choose what you want to do, and download the
                processed results.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  01
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Upload
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select JPG, PNG or WEBP images from your device.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  02
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Configure
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Select resize, compression, quality or upscaling and configure
                  the options.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                  03
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900">
                  Download
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Preview the results, compare the images and download your
                  processed files.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            ABOUT
        ============================================ */}
        <section id="about" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
                  About Imagify
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  Image processing without the complexity.
                </h2>

                <p className="mt-5 text-base leading-7 text-slate-500">
                  Imagify provides a straightforward platform for everyday image
                  processing. Instead of switching between different tools, you
                  can handle common image tasks from one place.
                </p>

                <p className="mt-4 text-base leading-7 text-slate-500">
                  Whether you need to reduce a file size, change dimensions,
                  improve quality or increase resolution, Imagify keeps the
                  workflow simple.
                </p>

                <Link
                  to="/upload"
                  className="mt-7 inline-flex rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Try Imagify
                </Link>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-slate-900">4</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Image processing tools
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-slate-900">3×</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Maximum upscale
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-slate-900">10 MB</p>

                    <p className="mt-1 text-sm text-slate-500">
                      Maximum upload size
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-2xl font-bold text-slate-900">JPG</p>

                    <p className="mt-1 text-sm text-slate-500">
                      PNG & WEBP supported
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            STORAGE CTA
        ============================================ */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              ▣
            </div>

            <h2 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Keep your images safe and organized.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Store your images securely in your Imagify storage and access them
              whenever you need them.
            </p>

            <Link
              to={isAuthenticated ? "/storage" : "/login"}
              className="mt-8 inline-flex rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl"
            >
              {isAuthenticated ? "Go to Storage" : "Sign in to Store Images"}
            </Link>
          </div>
        </section>
      </main>

      {/* ============================================
          FOOTER
      ============================================ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-slate-400">
              Simple and powerful image processing.
            </p>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} Imagify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
