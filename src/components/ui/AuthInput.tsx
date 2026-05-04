export default function AuthInput(props: any) {
  return (
    <input
      {...props}
      className="
        w-full 
        h-[48px]
        px-4
        mb-4
        rounded-lg 
        bg-gray-100 
        border border-gray-200 
        focus:outline-none 
        focus:border-[#6B2515]
        text-sm
      "
    />
  );
}