import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Parse request body
    const { email, password, fullName, companyName } = await req.json();

    if (!email || !password || !fullName || !companyName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, fullName, companyName" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Use service_role client to create everything
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 3. Create auth user
    const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm
    });

    if (createAuthError || !newUser.user) {
      return new Response(
        JSON.stringify({ error: createAuthError?.message ?? "Failed to create auth user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create company
    const companyId = crypto.randomUUID();
    const { error: companyError } = await supabaseAdmin
      .from("companies")
      .insert([{ id: companyId, name: companyName }]);

    if (companyError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: companyError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Create default store
    const storeId = crypto.randomUUID();
    const { error: storeError } = await supabaseAdmin
      .from("stores")
      .insert([{
        id: storeId,
        company_id: companyId,
        name: "Main Branch",
        address: "Default Location",
      }]);

    if (storeError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: storeError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Create admin profile (bypass RLS với service_role)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert([{
        id: newUser.user.id,
        company_id: companyId,
        store_id: storeId,
        full_name: fullName,
        email: email,
        role: "admin",
        is_active: true,
      }]);

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Success!
    return new Response(
      JSON.stringify({
        success: true,
        message: "Company registered successfully",
        userId: newUser.user.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message ?? "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});