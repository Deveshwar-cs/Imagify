import {Link} from "react-router-dom";

const UploadHeader = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          to="/home"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Imagify
        </Link>

        <nav className="flex items-center gap-7">
          <Link
            to="/home"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            Home
          </Link>

          <Link to="/upload" className="text-sm font-semibold text-slate-900">
            Upload
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default UploadHeader;
