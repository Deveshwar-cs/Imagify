const Navbar = () => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 font-bold text-white">
            I
          </div>

          <span className="text-xl font-bold tracking-tight">Imagify</span>
        </div>

        <div className="hidden text-sm text-slate-500 sm:block">
          Image Processing Platform
        </div>
      </div>
    </header>
  );
};

export default Navbar;
