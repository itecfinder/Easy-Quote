'use client';

import { useState, useEffect, useCallback } from 'react';
import { AppContext, emptyProject, emptyEstimate, type Screen } from './app-context';
import { DashboardScreen } from './dashboard-screen';
import { CaptureScreen } from './capture-screen';
import { ScanScreen } from './scan-screen';
import { EstimateScreen } from './estimate-screen';
import { PricesScreen } from './prices-screen';
import { InvoiceScreen } from './invoice-screen';
import { HistoryScreen } from './history-screen';
import { SettingsScreen } from './settings-screen';
import { Button } from '@/components/ui/button';
import { ScanLine, LayoutGrid, Camera, FileText, Receipt, History, Settings, LogOut, Menu, X, Crown } from 'lucide-react';
import type { Contractor, Estimate, ProjectData, ScanResult } from '@/lib/constants';
import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

const navItems: { screen: Screen; label: string; icon: any }[] = [
  { screen: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { screen: 'capture', label: 'New Project', icon: Camera },
  { screen: 'estimate', label: 'Estimate', icon: FileText },
  { screen: 'prices', label: 'Prices', icon: Receipt },
  { screen: 'invoice', label: 'Invoice', icon: FileText },
  { screen: 'history', label: 'History', icon: History },
  { screen: 'settings', label: 'Settings', icon: Settings },
];

export function AppShell({ session }: { session: { email: string; planId: number; memberType: 'paid' | 'free' | 'new' } }) {
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [mobileNav, setMobileNav] = useState(false);
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [project, setProject] = useState<ProjectData>(emptyProject);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [estimate, setEstimate] = useState<Estimate>(emptyEstimate);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('contractors')
        .select('*')
        .eq('email', session.email)
        .maybeSingle();
      if (data) {
        setContractor({
          id: data.id,
          email: data.email,
          companyName: data.company_name,
          phone: data.phone,
          address: data.address,
          license: data.license,
          website: data.website,
          logoUrl: data.logo_url,
          membershipPlan: data.membership_plan,
          createdAt: data.created_at,
        });
      } else {
        setContractor({ email: session.email, membershipPlan: session.planId });
      }
      setLoading(false);
    })();
  }, [session.email]);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    setMobileNav(false);
    window.scrollTo(0, 0);
  }, []);

  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  function handleExit() {
    localStorage.clear();
    fetch('/api/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
            <ScanLine className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  const ctx = {
    go,
    contractor,
    setContractor,
    memberType: session.memberType,
    planId: session.planId,
    project,
    setProject,
    scanResult,
    setScanResult,
    estimate,
    setEstimate,
    refreshKey,
    triggerRefresh,
  };

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-background flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card shrink-0">
          <div className="p-6 border-b">
            <div className="flex items-center gap-2 text-lg font-bold">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ScanLine className="h-5 w-5" />
              </div>
              Estimator Pro
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.screen}
                onClick={() => go(item.screen)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  screen === item.screen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t space-y-2">
            <div className="px-3 py-2 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-medium truncate">{session.email}</p>
              <div className="flex items-center gap-1 mt-1">
                {session.memberType === 'paid' && <Crown className="h-3 w-3 text-primary" />}
                <span className="text-xs text-muted-foreground capitalize">{session.memberType} plan</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleExit}>
              <LogOut className="mr-2 h-4 w-4" /> Exit
            </Button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card border-b px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ScanLine className="h-4 w-4" />
            </div>
            Estimator Pro
          </div>
          <Button size="icon" variant="ghost" onClick={() => setMobileNav(!mobileNav)}>
            {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile nav drawer */}
        {mobileNav && (
          <div className="lg:hidden fixed inset-0 z-30 bg-black/40" onClick={() => setMobileNav(false)}>
            <div className="absolute top-14 inset-x-0 bg-card border-b p-3 space-y-1 animate-in-slide" onClick={(e) => e.stopPropagation()}>
              {navItems.map((item) => (
                <button
                  key={item.screen}
                  onClick={() => go(item.screen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    screen === item.screen ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
              <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={handleExit}>
                <LogOut className="mr-2 h-4 w-4" /> Exit
              </Button>
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 overflow-x-hidden">
          <div className="max-w-5xl mx-auto">
            {screen === 'dashboard' && <DashboardScreen />}
            {screen === 'capture' && <CaptureScreen />}
            {screen === 'scan' && <ScanScreen />}
            {screen === 'estimate' && <EstimateScreen />}
            {screen === 'prices' && <PricesScreen />}
            {screen === 'invoice' && <InvoiceScreen />}
            {screen === 'history' && <HistoryScreen />}
            {screen === 'settings' && <SettingsScreen />}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  );
}
