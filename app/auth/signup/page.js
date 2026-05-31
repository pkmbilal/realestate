import { signUpAgent } from "@/app/actions";
import { PageShell } from "@/components/layout/PageShell";
import { Field, inputClass } from "@/components/forms/Field";
import { SAUDI_CITIES } from "@/lib/constants/options";

export default async function SignupPage(props) {
  const searchParams = await props.searchParams;

  return (
    <PageShell>
      <main className="mx-auto max-w-2xl px-4 py-10">
        <form action={signUpAgent} className="rounded-lg border border-zinc-200 bg-white p-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
              Agent or broker signup
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              New accounts stay pending until an admin reviews the license details.
            </p>
          </div>
          {searchParams?.error ? (
            <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
          ) : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input className={inputClass} name="full_name" required />
            </Field>
            <Field label="Role type">
              <select className={inputClass} name="role">
                <option value="agent">Agent</option>
                <option value="broker">Broker</option>
              </select>
            </Field>
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Password">
              <input className={inputClass} name="password" type="password" minLength={6} required />
            </Field>
            <Field label="Phone number">
              <input className={inputClass} name="phone" required />
            </Field>
            <Field label="WhatsApp number">
              <input className={inputClass} name="whatsapp" required />
            </Field>
            <Field label="Agency/company name">
              <input className={inputClass} name="agency_name" required />
            </Field>
            <Field label="City">
              <select className={inputClass} name="city" defaultValue="Riyadh">
                {SAUDI_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="License number">
              <input className={inputClass} name="license_number" required />
            </Field>
          </div>
          <button className="mt-6 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
            Create account
          </button>
        </form>
      </main>
    </PageShell>
  );
}
