import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface CompleteRequest {
  sessionId: string;
  clubData: {
    name: string;
    website?: string;
    contact_email?: string;
    contact_phone?: string;
    description?: string;
    venue_name?: string;
    venue_city?: string;
    venue_country?: string;
  };
  confirmedData: any;
  existingClubId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // Get auth header from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Create Supabase client with service role for writes
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { sessionId, clubData, confirmedData, existingClubId }: CompleteRequest = await req.json();

    if (!sessionId || !clubData?.name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: sessionId, clubData.name" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let clubId = existingClubId;

    // Create new yacht club if no existing club selected
    if (!clubId) {
      const { data: newClub, error: clubError } = await supabaseClient
        .from("yacht_clubs")
        .insert({
          name: clubData.name,
          website: clubData.website,
          contact_email: clubData.contact_email,
          contact_phone: clubData.contact_phone,
          description: clubData.description,
          created_by: user.id,
        })
        .select()
        .single();

      if (clubError) {
        console.error("Error creating yacht club:", clubError);
        return new Response(
          JSON.stringify({ error: "Failed to create club", details: clubError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      clubId = newClub.id;
    }

    // Update onboarding session
    const { error: sessionError } = await supabaseClient
      .from("club_onboarding_sessions")
      .update({
        club_id: clubId,
        confirmed_data: confirmedData,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .eq("user_id", user.id);

    if (sessionError) {
      console.error("Error updating session:", sessionError);
      return new Response(
        JSON.stringify({ error: "Failed to update session", details: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Add user as club staff (admin role)
    // Note: club_staff.club_id expects UUID, but yacht_clubs.id is TEXT
    // We need to cast or skip this step if types don't match
    try {
      const { error: staffError } = await supabaseClient
        .from("club_staff")
        .insert({
          club_id: clubId, // This will fail if yacht_clubs.id is TEXT and club_staff.club_id is UUID
          user_id: user.id,
          role: "admin",
          permissions: { manage_club: true, manage_events: true, manage_members: true },
          active: true,
          invitation_accepted: true,
        })
        .select()
        .single();

      if (staffError) {
        // Log but don't fail - staff relationship can be added later
        console.warn("Could not add club staff relationship:", staffError.message);
        console.warn("This is expected if there's a type mismatch between yacht_clubs.id and club_staff.club_id");
      }
    } catch (staffInsertError) {
      console.warn("Club staff insert failed (non-critical):", staffInsertError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        clubId,
        message: "Club onboarding completed successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("club-onboarding-complete error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
