import { useState } from "react";

interface Props {
  type: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export default function LGInput({
  type,
  label,
  value,
  onChange,
  error,
}: Props) {
  const [focus, setFocus] = useState(false);

  return (
    <div className="relative mb-4">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={`
          w-full px-3 pt-5 pb-2
          bg-gray-100
          border rounded-md text-sm
          transition-all duration-200

          hover:border-gray-400
          focus:outline-none focus:ring-2
          focus:bg-white

          ${
            error
              ? "border-red-500 focus:ring-red-400"
              : "border-gray-300 focus:ring-[#6B2515]/40"
          }
        `}
      />

      <label
        className={`
          absolute left-3 text-gray-500 transition-all pointer-events-none
          ${focus || value ? "top-1 text-xs" : "top-3 text-sm"}
        `}
      >
        {label}
      </label>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
}