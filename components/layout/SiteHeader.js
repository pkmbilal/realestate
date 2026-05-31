import Link from "next/link";
import { signOut } from "@/app/actions";

export function SiteHeader({ profile }) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight text-zinc-950">
          AqarDesk
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-zinc-700">
          <Link href="/">Properties</Link>
          {profile?.role === "admin" ? <Link href="/admin">Admin</Link> : null}
          {profile && ["agent", "broker"].includes(profile.role) ? (
            <Link href="/agent">Agent</Link>
          ) : null}
          {profile ? (
            <form action={signOut}>
              <button className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900">
                Sign out
              </button>
            </form>
          ) : (
            <>
              <Link href="/auth/login">Login</Link>
              <Link className="rounded-md bg-teal-700 px-3 py-2 text-white" href="/auth/signup">
                Agent signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
