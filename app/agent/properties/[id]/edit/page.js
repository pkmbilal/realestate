import { notFound, redirect } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { PropertyForm } from "@/components/forms/PropertyForm";
import { getSessionProfile } from "@/lib/data";
import { getR2ConfigStatus } from "@/lib/r2/client";

export default async function EditPropertyPage(props) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const { supabase, user, profile } = await getSessionProfile();

  if (!user) redirect("/auth/login");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile || !["agent", "broker"].includes(profile.role)) redirect("/");

  const { data: property } = await supabase.from("properties").select("*").eq("id", id).single();
  if (!property) notFound();

  const { data: images = [] } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", id)
    .order("sort_order", { ascending: true });
  const r2Config = getR2ConfigStatus();

  return (
    <PageShell>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Edit property</h1>
        {searchParams?.error ? (
          <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
        ) : null}
        <div className="mt-6">
          <PropertyForm
            property={property}
            images={images}
            canUploadImages={r2Config.isConfigured}
            missingUploadConfig={r2Config.missing}
          />
        </div>
      </main>
    </PageShell>
  );
}
