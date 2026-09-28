const Footer = () => {
  return (
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
  );
};

export default Footer;
