import { supabase } from "@/integrations/supabase/client";

const BUCKET = "avatars";
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

/**
 * Uploads a profile photo for the given user and returns a long-lived signed URL.
 * The bucket is private and files are namespaced per user id.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() ?? "jpg").replace(/[^a-zA-Z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext || "jpg"}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, TEN_YEARS);
  if (signError || !data?.signedUrl)
    throw signError ?? new Error("Could not sign photo URL");

  return data.signedUrl;
}
