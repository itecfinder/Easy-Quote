'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Building2, Save, Loader2, LogOut, Crown } from 'lucide-react';
import { useApp } from './app-context';
import { supabase } from '@/lib/supabase-client';
import { EXIT_URL } from '@/lib/constants';

export function SettingsScreen() {
  const { contractor, setContractor, memberType, planId } = useApp() as any;
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (contractor) {
      setCompanyName(contractor.companyName || '');
      setPhone(contractor.phone || '');
      setAddress(contractor.address || '');
      setLicense(contractor.license || '');
      setWebsite(contractor.website || '');
      setLogoUrl(contractor.logoUrl || '');
    }
  }, [contractor]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const updated = { ...contractor, companyName, phone, address, license, website, logoUrl };
      const { error } = await supabase
        .from('contractors')
        .update({ company_name: companyName, phone, address, license, website, logo_url: logoUrl })
        .eq('email', contractor.email);
      if (!error) {
        setContractor(updated);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleExit() {
    localStorage.clear();
    fetch('/api/session', { method: 'DELETE' }).finally(() => {
      window.location.href = EXIT_URL;
    });
  }

  return (
    <div className="space-y-6 animate-in-fade max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your business profile and membership.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Business Profile</CardTitle>
            <Badge variant={memberType === 'paid' ? 'default' : 'secondary'} className="flex items-center gap-1">
              {memberType === 'paid' && <Crown className="h-3 w-3" />}
              {memberType === 'paid' ? 'Paid Member' : 'Free Plan'}
            </Badge>
          </div>
          <CardDescription>Plan ID: {planId} • {contractor?.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cn">Company Name</Label>
            <Input id="cn" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Construction LLC" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">License #</Label>
              <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Lic. #12345" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, City, ST 00000" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          {saved && <p className="text-sm text-success">Profile saved.</p>}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {memberType !== 'paid' && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2"><Crown className="h-4 w-4 text-primary" /> Upgrade to Paid</h3>
              <p className="text-sm text-muted-foreground mt-1">Unlimited estimates with a paid membership.</p>
            </div>
            <Button onClick={() => (window.location.href = EXIT_URL)}>Upgrade</Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-destructive/30">
        <CardContent className="p-6 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><LogOut className="h-4 w-4 text-destructive" /> Exit</h3>
            <p className="text-sm text-muted-foreground mt-1">Sign out and return to the membership portal.</p>
          </div>
          <Button variant="destructive" onClick={handleExit}>Exit</Button>
        </CardContent>
      </Card>
    </div>
  );
}
