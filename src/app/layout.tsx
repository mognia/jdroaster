import "./globals.css";
import {Metadata} from "next";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export const metadata: Metadata = {
    title: 'jdRoaster',
    description: 'Deterministic job description linter with receipts.',
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
      <div className='min-h-dvh flex flex-col'>
        <Header />
          <main className={'flex-1'}>
              <div className={'mx-auto w-full max-w-5xl px-4 py-8'}>
                  {children}
              </div>
          </main>
          <Footer />
      </div>
      </body>
    </html>
  );
}
