import { redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { getSessionProfile } from "@/lib/data";
import { getR2ConfigStatus } from "@/lib/r2/client";

export default async function NewPropertyPage(props) {
  const searchParams = await props.searchParams;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile || !["agent", "broker"].includes(profile.role)) redirect("/");

  const r2Config = getR2ConfigStatus();

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Add property</h1>
        {profile.approval_status !== "approved" ? (
          <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Your account must be approved before you can submit properties.
          </p>
        ) : null}
        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
        ) : null}
        <div className="mt-6">
          <PropertyForm canUploadImages={r2Config.isConfigured} missingUploadConfig={r2Config.missing} />
        </div>
      </main>
    </PageShell>
  );
}
