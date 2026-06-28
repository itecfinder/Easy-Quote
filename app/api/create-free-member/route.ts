import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { createSession } from '@/lib/session';
import { FREE_PLAN, type Contractor } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const profile: Partial<Contractor> = {
      email,
      companyName: body.companyName,
      phone: body.phone,
      address: body.address,
      license: body.license,
      website: body.website,
      logoUrl: body.logoUrl,
      membershipPlan: FREE_PLAN,
    };

    const supabase = getSupabaseServer();

    // Upsert contractor profile.
    const { error: upsertErr } = await supabase
      .from('contractors')
      .upsert(profile, { onConflict: 'email' })
      .eq('email', email);
    if (upsertErr) {
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Initialize estimate_usage row.
    const { error: usageErr } = await supabase
      .from('estimate_usage')
      .upsert(
        { email, free_estimate_used: false, estimate_count: 0 },
        { onConflict: 'email' }
      );
    if (usageErr) {
      return NextResponse.json({ error: usageErr.message }, { status: 500 });
    }

    // Create BD account (best-effort).
    try {
      await fetch(
        `${process.env.BD_API_BASE || 'https://www.itecfinder.com/api'}/create-member`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, planId: FREE_PLAN, ...profile }),
        }
      );
    } catch {
      // Non-fatal — profile is stored locally.
    }

    await createSession({ email, planId: FREE_PLAN, memberType: 'free' });

    return NextResponse.json({ success: true, memberType: 'free' });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create member' },
      { status: 500 }
    );
  }
}
