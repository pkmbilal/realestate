import { signIn } from "@/app/actions";
import { PageShell } from "@/components/layout/PageShell";
import { Field, inputClass } from "@/components/forms/Field";

export default async function LoginPage(props) {
  const searchParams = await props.searchParams;

  return (
    <PageShell>
      <main className="mx-auto flex max-w-md flex-1 px-4 py-16">
        <form action={signIn} className="w-full rounded-lg border border-zinc-200 bg-white p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Login</h1>
          {searchParams?.redirect_to ? (
            <input type="hidden" name="redirect_to" value={searchParams.redirect_to} />
          ) : null}
          {searchParams?.message ? (
            <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{searchParams.message}</p>
          ) : null}
          {searchParams?.error ? (
            <p className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">{searchParams.error}</p>
          ) : null}
          <div className="mt-6 grid gap-4">
            <Field label="Email">
              <input className={inputClass} name="email" type="email" required />
            </Field>
            <Field label="Password">
              <input className={inputClass} name="password" type="password" required />
            </Field>
            <button className="rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white">
              Login
            </button>
          </div>
        </form>
      </main>
    </PageShell>
  );
}
