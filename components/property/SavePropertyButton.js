import { toggleSavedProperty } from "@/app/actions";

export function SavePropertyButton({ propertyId, isSaved = false, returnTo = "/", compact = false }) {
  return (
    <form action={toggleSavedProperty}>
      <input type="hidden" name="property_id" value={propertyId} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button
        className={
          compact
            ? "rounded-md border border-zinc-300 bg-white/95 px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm"
            : "rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900"
        }
        type="submit"
      >
        {isSaved ? "Saved" : "Save"}
      </button>
    </form>
  );
}
