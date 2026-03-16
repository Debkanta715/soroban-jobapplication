interface Props {
  type: "success" | "error" | "info";
  message: string;
  onClose: () => void;
}

const styles = {
  success:
    "bg-emerald-50 border-emerald-300 text-emerald-800",
  error: "bg-red-50 border-red-300 text-red-800",
  info: "bg-blue-50 border-blue-300 text-blue-800",
};

const icons = {
  success: "✅",
  error: "❌",
  info: "ℹ️",
};

export function Toast({ type, message, onClose }: Props) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm animate-[fadeIn_0.2s_ease] ${styles[type]}`}
    >
      <span>{icons[type]}</span>
      <p className="flex-1 leading-snug">{message}</p>
      <button
        onClick={onClose}
        className="opacity-60 hover:opacity-100 shrink-0 text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}
