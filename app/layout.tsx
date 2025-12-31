import "./globals.css";
import AppHeader from "../app/components/AppHeader";
import BottomNav from "../app/components/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[#F6F5F3] ">
        <AppHeader />
        <div className="">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}
