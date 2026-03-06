import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { createAdminClient } from "@/lib/supabase/admin";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(`${origin}/login?error=missing_sso_token`);
  }

  try {
    // 1. Verify the SSO JWT from UDS-HR
    const secret = new TextEncoder().encode(process.env.SSO_SHARED_SECRET!);
    const { payload } = await jwtVerify(token, secret, {
      issuer: "uds-hr",
      audience: "posbuddy",
    });

    const hrUserId = payload.hr_user_id as string;
    if (!hrUserId) {
      return NextResponse.redirect(`${origin}/login?error=invalid_sso_token`);
    }

    // 2. Look up the user in pos_staff by hr_user_id
    const admin = createAdminClient();
    const { data: staffRows } = await admin
      .from("pos_staff")
      .select("*")
      .eq("hr_user_id", hrUserId)
      .eq("is_active", true)
      .limit(1);

    const staff = (staffRows as Record<string, unknown>[] | null)?.[0];

    if (!staff) {
      return NextResponse.redirect(
        `${origin}/login?error=no_pos_access&message=${encodeURIComponent(
          "You are not registered in POSBUDDY. Contact your administrator."
        )}`
      );
    }

    // 3. Check if user already has a Supabase auth account, or create one
    const email = (payload.email as string) || `${hrUserId}@posbuddy.internal`;
    let authUserId = staff.auth_user_id as string | null;

    if (!authUserId) {
      // Default password: first 4 chars of name (lowercase) + last 4 digits of phone
      // e.g., "Sourabh Bhaumik" + "9836719911" → "sour9911"
      const nameStr = ((payload.full_name as string) || "user").toLowerCase().replace(/[^a-z]/g, "");
      const phoneStr = (payload.phone as string) || "0000";
      const defaultPassword = nameStr.slice(0, 4) + phoneStr.slice(-4);

      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: payload.full_name,
          hr_user_id: hrUserId,
        },
      });

      if (createError || !newUser.user) {
        // User might already exist with this email — try to find them
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existingUser = existingUsers.users.find((u) => u.email === email);
        if (existingUser) {
          authUserId = existingUser.id;
        } else {
          return NextResponse.redirect(
            `${origin}/login?error=sso_failed&message=${encodeURIComponent(
              "Failed to create your account. Contact support."
            )}`
          );
        }
      } else {
        authUserId = newUser.user.id;
      }

      // Link auth_user_id to pos_staff
      await (admin.from("pos_staff") as AnyQuery)
        .update({ auth_user_id: authUserId })
        .eq("staff_id", staff.staff_id);
    }

    // 4. Sync profile data from UDS-HR to pos_staff (keeps data fresh on each SSO login)
    await (admin.from("pos_staff") as AnyQuery)
      .update({
        full_name: (payload.full_name as string) || undefined,
        phone: (payload.phone as string) || undefined,
        email: (payload.email as string) || undefined,
        avatar_url: (payload.avatar_url as string) || undefined,
        last_synced_at: new Date().toISOString(),
      })
      .eq("staff_id", staff.staff_id);

    // 5. Generate a magic link (sign-in link) for the user
    //    We use generateLink to get a token, then redirect via /auth/callback
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: {
          redirectTo: `${origin}/auth/sso/callback`,
        },
      });

    if (linkError || !linkData) {
      return NextResponse.redirect(
        `${origin}/login?error=sso_session_failed`
      );
    }

    // The hashed_token from generateLink can be used with verifyOtp
    // But the simplest approach: redirect to the action_link which includes the OTP code
    // Extract the token_hash and redirect through Supabase's verify endpoint
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const tokenHash = linkData.properties.hashed_token;

    // Determine redirect path based on department
    const department = staff.department as string;
    const isAdmin = staff.is_admin as boolean;
    let redirectPath = "/dashboard";
    if (department === "FSE") {
      redirectPath = "/my-calls";
    }
    if (isAdmin) {
      redirectPath = "/dashboard";
    }

    // Use Supabase's verify endpoint which sets the session cookies
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=magiclink&redirect_to=${encodeURIComponent(
      `${origin}/auth/sso/callback?next=${redirectPath}`
    )}`;

    return NextResponse.redirect(verifyUrl);
  } catch (err) {
    const message =
      err instanceof Error && err.message.includes("expired")
        ? "SSO link expired. Please try again from UDS-HR."
        : "SSO verification failed.";
    return NextResponse.redirect(
      `${origin}/login?error=sso_failed&message=${encodeURIComponent(message)}`
    );
  }
}
