const actions = [
  {
    id: "resize",
    title: "Resize",
    description: "Change image dimensions",
    icon: "↔",
  },
  {
    id: "compress",
    title: "Compress",
    description: "Reduce file size",
    icon: "◉",
  },
  {
    id: "quality",
    title: "Improve Quality",
    description: "Enhance image appearance",
    icon: "✦",
  },
  {
    id: "upscale",
    title: "Upscale",
    description: "Increase image resolution",
    icon: "↗",
  },
];

const ActionSelector = ({selectedAction, onSelect}) => {
  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">
          Choose an action
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Select what you want to do with your image.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {actions.map((action) => {
          const isSelected = selectedAction === action.id;

          return (
            <button
              key={action.id}
              onClick={() => onSelect(action.id)}
              className={`rounded-2xl border p-5 text-left transition ${
                isSelected
                  ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${
                  isSelected ? "bg-white/10" : "bg-slate-100"
                }`}
              >
                {action.icon}
              </div>

              <h3 className="mt-4 font-semibold">{action.title}</h3>

              <p
                className={`mt-1 text-sm ${
                  isSelected ? "text-slate-300" : "text-slate-500"
                }`}
              >
                {action.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ActionSelector;
