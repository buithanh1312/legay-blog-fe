export default function AuthButton({ children, disabled, ...props }: any) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={`
        w-full 
        h-[48px]
        rounded-lg 
        font-semibold 
        text-sm
        transition
        ${disabled
          ? "bg-gray-300 text-gray-400 cursor-not-allowed"
          : "bg-[#6B2515] text-white hover:opacity-90 cursor-pointer"
        }
      `}
    >
      {children}
    </button>
  );
}