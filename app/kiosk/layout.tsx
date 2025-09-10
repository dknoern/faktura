import KioskLayout from "@/components/kiosk-layout";

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KioskLayout>{children}</KioskLayout>;
}
