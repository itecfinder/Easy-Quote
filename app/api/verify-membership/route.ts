import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import { createSession } from '@/lib/session';
import { PAID_PLANS, FREE_PLAN, EXIT_URL, type MemberType } from '@/lib/constants';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const normalized = email.trim().toLowerCase();

    const supabase = getSupabaseServer();

    // 1. Query BD Membership API to determine plan.
    let planId: number | null = null;
    let bdFound = false;
    try {
      const res = await fetch(
        `${process.env.BD_API_BASE || 'https://www.itecfinder.com/api'}/membership?email=${encodeURIComponent(normalized)}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      if (res.ok) {
        const data = await res.json();
        bdFound = true;
        planId = Number(data?.planId ?? data?.plan_id ?? data?.membershipPlan);
        if (Number.isNaN(planId)) planId = null;
      }
    } catch {
      // BD API unreachable — treat as new lead.
    }

    // 2. Determine membership type.
    let memberType: MemberType;
    let effectivePlan: number;

    if (planId != null && PAID_PLANS.includes(planId)) {
      memberType = 'paid';
      effectivePlan = planId;
    } else if (planId === FREE_PLAN) {
      memberType = 'free';
      effectivePlan = FREE_PLAN;
    } else {
      // New contractor (lead) — check Supabase for existing record.
      const { data: existing } = await supabase
        .from('contractors')
        .select('email, membership_plan')
        .eq('email', normalized)
        .maybeSingle();

      if (existing) {
        const p = existing.membership_plan;
        if (PAID_PLANS.includes(p)) {
          memberType = 'paid';
          effectivePlan = p;
        } else {
          memberType = 'free';
          effectivePlan = FREE_PLAN;
        }
      } else {
        memberType = 'new';
        effectivePlan = FREE_PLAN;
      }
    }

    // 3. Check free estimate usage for free members.
    let freeEstimateUsed = false;
    if (memberType === 'free') {
      const { data: usage } = await supabase
        .from('estimate_usage')
        .select('free_estimate_used, estimate_count')
        .eq('email', normalized)
        .maybeSingle();
      if (usage) {
        freeEstimateUsed = usage.free_estimate_used || usage.estimate_count >= 1;
      }
    }

    // 4. Enforce free limit — redirect to BD login if used.
    if (memberType === 'free' && freeEstimateUsed) {
      return NextResponse.json(
        { allowed: false, redirect: EXIT_URL, reason: 'free_estimate_used' },
        { status: 403 }
      );
    }

    // 5. Create session.
    await createSession({ email: normalized, planId: effectivePlan, memberType });

    return NextResponse.json({
      allowed: true,
      memberType,
      planId: effectivePlan,
      freeEstimateUsed,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Verification failed' },
      { status: 500 }
    );
  }
}
