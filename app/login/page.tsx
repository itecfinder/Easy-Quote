'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, ShieldCheck, ScanLine, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import { EXIT_URL } from '@/lib/constants';

type Step = 'verify' | 'profile' | 'redirect';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('verify');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // profile fields
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [license, setLicense] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.redirect) {
          setStep('redirect');
          return;
        }
        throw new Error(data.error || 'Verification failed');
      }
      if (data.memberType === 'new') {
        setStep('profile');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/create-free-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, companyName, phone, address, license, website, logoUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create profile');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'redirect') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
        <Card className="w-full max-w-md animate-in-fade">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <AlertCircle className="h-7 w-7 text-warning" />
            </div>
            <CardTitle>Free Estimate Used</CardTitle>
            <CardDescription>
              You have already used your free estimate. Upgrade your membership to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg" onClick={() => (window.location.href = EXIT_URL)}>
              Go to Membership Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 py-8">
        <Card className="w-full max-w-lg animate-in-slide">
          <CardHeader>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">New Contractor</span>
            </div>
            <CardTitle>Set Up Your Business Profile</CardTitle>
            <CardDescription>
              Welcome! You get one free estimate. Enter your business details to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Acme Construction LLC" />
              </div>
              <div className="grid grid-cols-2 gap-3">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
              <ScanLine className="h-6 w-6" />
            </div>
            Estimator Pro
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            AI-Powered Estimates<br />Built From a Photo.
          </h1>
          <p className="text-lg text-sky-100">
            Scan project sites, generate accurate line items, compare supplier prices, and ship professional invoices — all from your phone.
          </p>
          <div className="space-y-3 pt-4">
            {[
              { icon: ScanLine, text: 'AI image analysis detects materials, labor & demolition' },
              { icon: FileText, text: 'Build estimates and invoices in minutes' },
              { icon: ShieldCheck, text: 'BD Membership verified — one free estimate for new contractors' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sky-50">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur shrink-0">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-sm text-sky-200">Trusted by contractors nationwide</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4">
        <div className="w-full max-w-md animate-in-slide">
          <div className="lg:hidden mb-8 flex items-center gap-2 text-2xl font-bold text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ScanLine className="h-6 w-6" />
            </div>
            Estimator Pro
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Access Checkpoint</CardTitle>
              <CardDescription>
                Enter the email on file with your BD Membership to verify access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Membership Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contractor@example.com"
                    required
                    autoFocus
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Verify Membership
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Paid members get unlimited estimates. New contractors get one free.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
