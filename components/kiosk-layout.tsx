import localFont from "next/font/local";
import UserButton from "@/components/user-button";
import { fetchTenantById } from "@/lib/data";
import Image from "next/image";
import Link from "next/link";


const geistSans = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../app/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default async function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // Fetch tenant data for logo
  let tenant = null;
  try {
    if (process.env.MONGODB_URI && process.env.MONGODB_URI.startsWith('mongodb')) {
      tenant = await fetchTenantById("67f48a2050abe41246b22a87");
    }
  } catch (error) {
    console.warn('Could not fetch tenant for kiosk layout:', error instanceof Error ? error.message : 'Unknown error');
  }

  return (
    <div
      className={`min-h-screen ${geistSans.variable} ${geistMono.variable} antialiased relative`}
    >
      {/* Full screen background image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/rolex-sky-dweller.jpg"
          alt="Luxury watches background"
          fill
          className="object-cover"
          priority
        />
      </div>
      {/* Fixed header with logo and user button */}
      <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between  px-4">
        <div className="flex items-center gap-4">
          {tenant?._id ? (
            <Link href="/kiosk" className="cursor-pointer">
              <Image
                src={`/api/images/logo-${tenant._id}.png`}
                alt="Company Logo"
                width={120}
                height={48}
                className="h-12 w-auto hover:opacity-70 transition-opacity"
              />
            </Link>
          ) : (
            <Link href="/kiosk" className="cursor-pointer hover:opacity-10 transition-opacity">
              <h1 className="text-xl font-semibold">Kiosk Mode</h1>
            </Link>
          )}
        </div>
        <div>
          <UserButton />
        </div>
      </header>

      {/* Main content area with top padding to account for fixed header */}
      <main className="relative z-10 mt-16 px-6 pb-20">
        <div className="mx-auto max-w-3xl w-full pt-6">
          {children}
        </div>
      </main>
    </div>
  );
}
