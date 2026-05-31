import { updateAgentProfile } from "@/app/actions";
import { SAUDI_CITIES } from "@/lib/constants/options";
import { Field, inputClass } from "@/components/forms/Field";

export function AgentProfileForm({ profile }) {
  return (
    <form action={updateAgentProfile} className="grid gap-6 rounded-lg border border-zinc-200 bg-white p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name">
          <input className={inputClass} name="full_name" defaultValue={profile.full_name || ""} required />
        </Field>
        <Field label="Agency name">
          <input className={inputClass} name="agency_name" defaultValue={profile.agency_name || ""} />
        </Field>
        <Field label="Phone">
          <input className={inputClass} name="phone" defaultValue={profile.phone || ""} inputMode="tel" />
        </Field>
        <Field label="WhatsApp">
          <input className={inputClass} name="whatsapp" defaultValue={profile.whatsapp || ""} inputMode="tel" />
        </Field>
        <Field label="City">
          <select className={inputClass} name="city" defaultValue={profile.city || "Riyadh"}>
            {SAUDI_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="License number">
          <input className={inputClass} name="license_number" defaultValue={profile.license_number || ""} />
        </Field>
      </div>
      <Field label="Public bio">
        <textarea
          className={`${inputClass} min-h-36`}
          name="bio"
          defaultValue={profile.bio || ""}
          maxLength={1200}
          placeholder="Describe your market focus, experience, and the clients you work with."
        />
      </Field>
      <label className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        <input
          className="mt-1"
          name="profile_public"
          type="checkbox"
          defaultChecked={profile.profile_public !== false}
        />
        <span>
          <span className="block font-medium text-zinc-950">Show my public agent profile</span>
          <span className="mt-1 block">When enabled, approved visitors can view your agent profile and contact details.</span>
        </span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white">
          Save profile
        </button>
      </div>
    </form>
  );
}
