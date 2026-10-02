import {useEffect} from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-md",
}) => {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-3 py-4 sm:px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`my-auto w-full ${maxWidth} rounded-2xl bg-white p-4 shadow-xl sm:p-6`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="mb-5 sm:mb-6">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-gray-900 sm:text-xl"
          >
            {title}
          </h2>

          {description && (
            <p
              id="modal-description"
              className="mt-1 text-sm leading-5 text-gray-500"
            >
              {description}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default Modal;
