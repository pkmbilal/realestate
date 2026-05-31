import { createClient } from "@/lib/supabase/server";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { supabase, user, profile };
}

export function requireRole(profile, roles) {
  return Boolean(profile && roles.includes(profile.role));
}

export function formatPrice(value, purpose) {
  const price = Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  return `SAR ${price}${purpose === "rent" ? " / year" : ""}`;
}
