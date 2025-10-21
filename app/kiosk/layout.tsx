import KioskLayout from "@/components/kiosk-layout";

// Force dynamic rendering since kiosk layout fetches tenant data
export const dynamic = 'force-dynamic';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KioskLayout>{children}</KioskLayout>;
}
