const styles = {
  draft: "bg-zinc-100 text-zinc-700",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  approved: "bg-emerald-100 text-emerald-800",
  suspended: "bg-zinc-200 text-zinc-800",
};

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}
