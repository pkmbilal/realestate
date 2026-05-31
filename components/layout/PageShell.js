import { getSessionProfile } from "@/lib/data";
import { SiteHeader } from "@/components/layout/SiteHeader";

export async function PageShell({ children }) {
  const { user, profile } = await getSessionProfile();

  return (
    <div className="min-h-dvh bg-[#F7F8F6]">
      <SiteHeader user={user} profile={profile} />
      {children}
    </div>
  );
}
