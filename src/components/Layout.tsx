import Navbar from "./Navbar";

export default function Layout({ children }: any) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">{children}</div>
    </div>
  );
}