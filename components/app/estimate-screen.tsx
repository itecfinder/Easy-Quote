'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, ArrowRight, Package, Wrench, Calculator } from 'lucide-react';
import { useApp, calcTotals } from './app-context';
import type { LineItem } from '@/lib/constants';

export function EstimateScreen() {
  const { go, project, scanResult, estimate, setEstimate, contractor } = useApp() as any;
  const [items, setItems] = useState<LineItem[]>(
    estimate.lineItems.length ? estimate.lineItems : scanResult?.suggestedLineItems || []
  );
  const [taxRate, setTaxRate] = useState(8.5);
  const [markupRate, setMarkupRate] = useState(20);
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(items, taxRate, markupRate);

  useEffect(() => {
    setEstimate({ ...estimate, lineItems: items, ...totals });
  }, [items, taxRate, markupRate]);

  function addItem() {
    setItems((prev) => [
      ...prev,
      { id: `li_${Date.now()}`, description: '', qty: 1, unit: 'ea', unitPrice: 0, category: 'material' },
    ]);
  }

  function updateItem(id: string, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function saveProject() {
    if (!contractor?.email) return;
    setSaving(true);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      const { data: proj } = await supabase
        .from('projects')
        .insert({
          contractor_email: contractor.email,
          customer_name: project.customerName,
          customer_email: project.customerEmail,
          project_type: project.projectType,
          status: 'estimated',
          estimate_total: totals.grandTotal,
          project_data_json: project,
        })
        .select('id')
        .single();
      if (proj?.id) {
        await supabase.from('estimates').insert({
          project_id: proj.id,
          line_items_json: items,
          subtotal: totals.subtotal,
          tax: totals.tax,
          markup: totals.markup,
          grand_total: totals.grandTotal,
        });
      }
    } finally {
      setSaving(false);
      go('invoice');
    }
  }

  return (
    <div className="space-y-6 animate-in-fade max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Estimate Editor</h1>
        <p className="text-muted-foreground mt-1">Adjust line items, labor, materials, markups, and taxes.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Calculator className="h-5 w-5 text-primary" /> Line Items</CardTitle>
            <Button size="sm" variant="outline" onClick={addItem}><Plus className="mr-1 h-4 w-4" /> Add Item</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items yet. Add one above.</p>}
          {items.map((it) => (
            <div key={it.id} className="rounded-lg border p-3 space-y-2 bg-card">
              <div className="flex items-start gap-2">
                <Input
                  placeholder="Description"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, 'description', e.target.value)}
                  className="flex-1"
                />
                <Button size="icon" variant="ghost" onClick={() => removeItem(it.id)} className="text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Qty</Label>
                  <Input type="number" value={it.qty} onChange={(e) => updateItem(it.id, 'qty', Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Unit</Label>
                  <Input value={it.unit} onChange={(e) => updateItem(it.id, 'unit', e.target.value)} placeholder="sqft" />
                </div>
                <div>
                  <Label className="text-xs">Unit Price</Label>
                  <Input type="number" step="0.01" value={it.unitPrice} onChange={(e) => updateItem(it.id, 'unitPrice', Number(e.target.value))} />
                </div>
                <div>
                  <Label className="text-xs">Category</Label>
                  <select
                    value={it.category}
                    onChange={(e) => updateItem(it.id, 'category', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Labor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <Badge variant={it.category === 'material' ? 'default' : 'secondary'} className="capitalize">
                  {it.category === 'material' ? <Package className="mr-1 h-3 w-3" /> : <Wrench className="mr-1 h-3 w-3" />}
                  {it.category}
                </Badge>
                <span className="text-sm font-semibold">${(it.qty * it.unitPrice).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Markups & Tax</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="markup">Markup %</Label>
            <Input id="markup" type="number" value={markupRate} onChange={(e) => setMarkupRate(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tax">Tax %</Label>
            <Input id="tax" type="number" step="0.1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/40">
        <CardContent className="p-6 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${totals.subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Markup ({markupRate}%)</span><span className="font-medium">${totals.markup.toFixed(2)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="font-medium">${totals.tax.toFixed(2)}</span></div>
          <div className="border-t pt-2 flex justify-between text-lg font-bold"><span>Grand Total</span><span className="text-primary">${totals.grandTotal.toFixed(2)}</span></div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => go('scan')}>Back</Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={saveProject} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Project'}
          </Button>
          <Button onClick={() => go('invoice')}>
            Build Invoice <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
