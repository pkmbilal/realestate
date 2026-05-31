import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createLead } from "@/app/actions";
import { PageShell } from "@/components/layout/PageShell";
import { Field, inputClass } from "@/components/forms/Field";
import { formatPrice } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";

export default async function PropertyDetailPage(props) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("*, property_images(*), profiles(id, full_name, phone, whatsapp, email, agency_name, city, role)")
    .eq("id", id)
    .single();

  if (!property) notFound();

  const images = [...(property.property_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const agent = property.profiles;
  const whatsapp = agent?.whatsapp?.replace(/[^0-9]/g, "");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", user.id)
        .single()
    : { data: null };
  const loginHref = `/auth/login?message=${encodeURIComponent(
    "Login to send an enquiry.",
  )}&redirect_to=${encodeURIComponent(`/properties/${property.id}`)}`;

  return (
    <PageShell>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {searchParams?.message ? (
          <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</p>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="grid gap-3">
              <div className="aspect-[16/9] overflow-hidden rounded-lg bg-zinc-100">
                {images[0] ? (
                  <Image
                    className="h-full w-full object-cover"
                    src={images[0].public_url}
                    alt={property.title}
                    width={1200}
                    height={675}
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-500">No image</div>
                )}
              </div>
              {images.length > 1 ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.slice(1, 4).map((image) => (
                    <Image
                      key={image.id}
                      className="aspect-[4/3] rounded-md object-cover"
                      src={image.public_url}
                      alt=""
                      width={360}
                      height={270}
                    />
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6">
              <p className="text-2xl font-semibold text-zinc-950">
                {formatPrice(property.price, property.purpose)}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{property.title}</h1>
              <p className="mt-2 text-zinc-600">
                {property.district}, {property.city}
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {[
                  ["Beds", property.bedrooms],
                  ["Baths", property.bathrooms],
                  ["Area", `${Number(property.area_sqm).toLocaleString("en-US")} sqm`],
                  ["Type", property.property_type],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-zinc-200 p-3">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
                    <p className="mt-1 font-semibold text-zinc-950">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-zinc-950">Description</h2>
                <p className="mt-3 whitespace-pre-line leading-7 text-zinc-700">{property.description}</p>
              </div>
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-zinc-950">Location</h2>
                <p className="mt-3 text-zinc-700">{property.address || `${property.district}, ${property.city}`}</p>
              </div>
            </div>
          </section>
          <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-zinc-950">Contact agent</h2>
            <div className="mt-4 rounded-md bg-zinc-50 p-4">
              <p className="font-semibold text-zinc-950">{agent?.full_name}</p>
              <p className="mt-1 text-sm text-zinc-600">{agent?.agency_name}</p>
              {agent?.id ? (
                <Link className="mt-2 inline-block text-sm font-semibold text-teal-700" href={`/agents/${agent.id}`}>
                  View profile
                </Link>
              ) : null}
            </div>
            <div className="mt-4 grid gap-2">
              {agent?.phone ? (
                <a className="rounded-md bg-teal-700 px-4 py-3 text-center text-sm font-semibold text-white" href={`tel:${agent.phone}`}>
                  Call
                </a>
              ) : null}
              {whatsapp ? (
                <a className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href={`https://wa.me/${whatsapp}`}>
                  WhatsApp
                </a>
              ) : null}
              {agent?.email ? (
                <a className="rounded-md border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-900" href={`mailto:${agent.email}`}>
                  Email
                </a>
              ) : null}
            </div>
            {user ? (
              <form action={createLead} className="mt-6 grid gap-3">
                <input type="hidden" name="property_id" value={property.id} />
                <Field label="Name">
                  <input className={inputClass} name="customer_name" defaultValue={profile?.full_name || ""} />
                </Field>
                <Field label="Phone">
                  <input className={inputClass} name="customer_phone" defaultValue={profile?.phone || ""} />
                </Field>
                <Field label="Email">
                  <input className={inputClass} name="customer_email" type="email" defaultValue={profile?.email || user.email || ""} />
                </Field>
                <Field label="Message">
                  <textarea className={`${inputClass} min-h-24`} name="message" defaultValue={`I am interested in ${property.title}.`} />
                </Field>
                <button className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white">
                  Send enquiry
                </button>
              </form>
            ) : (
              <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm text-zinc-700">Login to send an enquiry to this agent.</p>
                <Link className="mt-3 inline-flex rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white" href={loginHref}>
                  Login to enquire
                </Link>
              </div>
            )}
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
