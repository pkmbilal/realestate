"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/data";
import { deletePropertyImage, getR2ConfigStatus, uploadPropertyImage } from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUSES } from "@/lib/constants/leads";

function value(formData, key) {
  return String(formData.get(key) || "").trim();
}

function numberValue(formData, key, fallback = 0) {
  const raw = value(formData, key);
  return raw === "" ? fallback : Number(raw);
}

async function requireAdmin() {
  const context = await getSessionProfile();
  if (!context.profile || context.profile.role !== "admin") {
    redirect("/auth/login");
  }
  return context;
}

async function requireAgent() {
  const context = await getSessionProfile();
  if (!context.profile || !["agent", "broker"].includes(context.profile.role)) {
    redirect("/auth/login");
  }
  return context;
}

export async function signIn(formData) {
  const supabase = await createClient();
  const email = value(formData, "email");
  const password = value(formData, "password");
  const redirectTo = value(formData, "redirect_to");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect("/auth/login?error=Invalid email or password");
  }

  if (redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
    redirect(redirectTo);
  }

  const { data } = await supabase.from("profiles").select("role").eq("email", email).single();
  redirect(data?.role === "admin" ? "/admin" : "/agent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function signUpAgent(formData) {
  const supabase = await createClient();
  const role = value(formData, "role") === "broker" ? "broker" : "agent";

  const { error } = await supabase.auth.signUp({
    email: value(formData, "email"),
    password: value(formData, "password"),
    options: {
      data: {
        full_name: value(formData, "full_name"),
        phone: value(formData, "phone"),
        whatsapp: value(formData, "whatsapp"),
        role,
        agency_name: value(formData, "agency_name"),
        city: value(formData, "city"),
        license_number: value(formData, "license_number"),
      },
    },
  });

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login?message=Account created. The first account becomes admin; later agents require approval.");
}

function propertyPayload(formData, agentId) {
  const submitAction = value(formData, "submit_action");

  return {
    agent_id: agentId,
    title: value(formData, "title"),
    description: value(formData, "description"),
    purpose: value(formData, "purpose") === "rent" ? "rent" : "sale",
    property_type: value(formData, "property_type"),
    price: numberValue(formData, "price"),
    city: value(formData, "city"),
    district: value(formData, "district"),
    address: value(formData, "address"),
    bedrooms: numberValue(formData, "bedrooms"),
    bathrooms: numberValue(formData, "bathrooms"),
    area_sqm: numberValue(formData, "area_sqm"),
    furnished: formData.get("furnished") === "on",
    status: submitAction === "submit" ? "pending" : "draft",
    rejection_reason: null,
  };
}

async function attachImages(supabase, propertyId, files) {
  const realFiles = files.filter((file) => file && file.size > 0);
  if (realFiles.length === 0) {
    return;
  }

  const r2Config = getR2ConfigStatus();
  if (!r2Config.isConfigured) {
    throw new Error(`Image upload is not configured. Missing: ${r2Config.missing.join(", ")}.`);
  }

  const { count } = await supabase
    .from("property_images")
    .select("id", { count: "exact", head: true })
    .eq("property_id", propertyId);

  const rows = [];
  for (let index = 0; index < realFiles.length; index += 1) {
    const uploaded = await uploadPropertyImage({ propertyId, file: realFiles[index] });
    if (uploaded) {
      rows.push({
        property_id: propertyId,
        object_key: uploaded.object_key,
        public_url: uploaded.public_url,
        sort_order: (count || 0) + index,
      });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("property_images").insert(rows);
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function createProperty(formData) {
  const { supabase, user, profile } = await requireAgent();

  if (profile.approval_status !== "approved") {
    redirect("/agent?error=Your account must be approved before adding properties.");
  }

  const { data, error } = await supabase
    .from("properties")
    .insert(propertyPayload(formData, user.id))
    .select("id")
    .single();

  if (error) {
    redirect(`/agent/properties/new?error=${encodeURIComponent(error.message)}`);
  }

  try {
    await attachImages(supabase, data.id, formData.getAll("images"));
  } catch (error) {
    redirect(`/agent/properties/${data.id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/agent");
}

export async function updateProperty(formData) {
  const { supabase, user } = await requireAgent();
  const propertyId = value(formData, "property_id");
  const payload = propertyPayload(formData, user.id);

  const { error } = await supabase.from("properties").update(payload).eq("id", propertyId);
  if (error) {
    redirect(`/agent/properties/${propertyId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  try {
    await attachImages(supabase, propertyId, formData.getAll("images"));
  } catch (uploadError) {
    redirect(`/agent/properties/${propertyId}/edit?error=${encodeURIComponent(uploadError.message)}`);
  }

  revalidatePath("/");
  redirect("/agent");
}

export async function deleteProperty(formData) {
  const { supabase } = await requireAgent();
  const propertyId = value(formData, "property_id");

  const { data: images } = await supabase
    .from("property_images")
    .select("object_key")
    .eq("property_id", propertyId);

  const { error } = await supabase.from("properties").delete().eq("id", propertyId);
  if (error) {
    redirect("/agent");
  }

  await Promise.allSettled((images || []).map((image) => deletePropertyImage(image.object_key)));
  revalidatePath("/");
  redirect("/agent");
}

export async function deleteImage(formData) {
  const { supabase } = await requireAgent();
  const imageId = value(formData, "image_id");
  const propertyId = value(formData, "property_id");
  const objectKey = value(formData, "object_key");

  const { error } = await supabase.from("property_images").delete().eq("id", imageId);
  if (!error) {
    await deletePropertyImage(objectKey);
  }

  revalidatePath(`/agent/properties/${propertyId}/edit`);
  redirect(`/agent/properties/${propertyId}/edit`);
}

export async function updateAgentStatus(formData) {
  const { supabase } = await requireAdmin();

  await supabase
    .from("profiles")
    .update({
      approval_status: value(formData, "approval_status"),
      rejection_reason: value(formData, "rejection_reason"),
    })
    .eq("id", value(formData, "agent_id"));

  revalidatePath("/admin/agents");
  redirect("/admin/agents");
}

export async function updatePropertyStatus(formData) {
  const { supabase } = await requireAdmin();
  const status = value(formData, "status");

  await supabase
    .from("properties")
    .update({
      status,
      rejection_reason: status === "rejected" ? value(formData, "rejection_reason") : null,
    })
    .eq("id", value(formData, "property_id"));

  revalidatePath("/");
  revalidatePath("/admin/properties");
  redirect("/admin/properties");
}

export async function createLead(formData) {
  const supabase = await createClient();
  const propertyId = value(formData, "property_id");
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Login to send an enquiry.")}&redirect_to=${encodeURIComponent(
        `/properties/${propertyId}`,
      )}`,
    );
  }

  const { data: property } = await supabase
    .from("properties")
    .select("agent_id")
    .eq("id", propertyId)
    .eq("status", "published")
    .single();

  if (!property) {
    redirect("/");
  }

  await supabase.from("leads").insert({
    property_id: propertyId,
    agent_id: property.agent_id,
    customer_name: value(formData, "customer_name"),
    customer_email: value(formData, "customer_email"),
    customer_phone: value(formData, "customer_phone"),
    message: value(formData, "message"),
    lead_type: "form",
  });

  redirect(`/properties/${propertyId}?message=Your enquiry was sent.`);
}

export async function updateLead(formData) {
  const { supabase, user } = await requireAgent();
  const leadId = value(formData, "lead_id");
  const returnTo = value(formData, "return_to") || "/agent/leads";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/agent/leads";
  const status = value(formData, "status");
  const followUpAt = value(formData, "follow_up_at");
  const parsedFollowUpAt = followUpAt ? new Date(followUpAt) : null;

  if (!LEAD_STATUSES.includes(status)) {
    redirect(`${safeReturnTo}${safeReturnTo.includes("?") ? "&" : "?"}error=Invalid lead status`);
  }

  if (parsedFollowUpAt && Number.isNaN(parsedFollowUpAt.getTime())) {
    redirect(`${safeReturnTo}${safeReturnTo.includes("?") ? "&" : "?"}error=Invalid follow-up date`);
  }

  const { error } = await supabase
    .from("leads")
    .update({
      status,
      agent_notes: value(formData, "agent_notes") || null,
      follow_up_at: parsedFollowUpAt ? parsedFollowUpAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("agent_id", user.id);

  if (error) {
    redirect(`${safeReturnTo}${safeReturnTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/agent");
  revalidatePath("/agent/leads");
  redirect(safeReturnTo);
}

export async function toggleSavedProperty(formData) {
  const supabase = await createClient();
  const propertyId = value(formData, "property_id");
  const returnTo = value(formData, "return_to") || "/";
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `/auth/login?message=${encodeURIComponent("Login to save properties.")}&redirect_to=${encodeURIComponent(
        safeReturnTo,
      )}`,
    );
  }

  const { data: existing } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();

  if (existing) {
    await supabase.from("saved_properties").delete().eq("id", existing.id);
  } else {
    await supabase.from("saved_properties").insert({
      user_id: user.id,
      property_id: propertyId,
    });
  }

  revalidatePath("/");
  revalidatePath("/saved");
  revalidatePath(`/properties/${propertyId}`);
  redirect(safeReturnTo);
}
