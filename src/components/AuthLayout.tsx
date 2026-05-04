import logo from "../assets/logo.png";

export default function AuthLayout({ children }: any) {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">

      <div className="
        w-[900px] h-[500px] 
        bg-white rounded-2xl shadow-lg 
        flex overflow-hidden
      ">

        {/* LEFT - LOGO */}
        <div className="w-1/2 flex items-center justify-center bg-gray-50">
          <img src={logo} className="w-72 max-w-[90%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition duration-300 hover:scale-105" />
        </div>

        {/* RIGHT - FORM */}
        <div className="w-1/2 flex items-center justify-center p-10">
          <div className="w-full max-w-[320px]">
            {children}
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="absolute bottom-5 text-gray-400 text-sm">
        © 2026 Legay Team. All rights reserved.
      </div>
    </div>
  );
}