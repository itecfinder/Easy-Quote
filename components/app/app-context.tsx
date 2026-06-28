'use client';

import { createContext, useContext } from 'react';
import type { Contractor, Estimate, LineItem, ProjectData, ScanResult } from '@/lib/constants';

export type Screen =
  | 'dashboard'
  | 'capture'
  | 'scan'
  | 'estimate'
  | 'prices'
  | 'invoice'
  | 'history'
  | 'settings';

interface AppContextValue {
  go: (screen: Screen) => void;
  contractor: Contractor | null;
  setContractor: (c: Contractor | null) => void;
  memberType: 'paid' | 'free' | 'new';
  planId: number;
  project: ProjectData;
  setProject: (p: ProjectData) => void;
  scanResult: ScanResult | null;
  setScanResult: (s: ScanResult | null) => void;
  estimate: Estimate;
  setEstimate: (e: Estimate) => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppContext');
  return ctx;
}

export const emptyProject: ProjectData = {
  customerName: '',
  customerEmail: '',
  projectType: '',
  images: [],
};

export const emptyEstimate: Estimate = {
  lineItems: [],
  subtotal: 0,
  tax: 0,
  markup: 0,
  grandTotal: 0,
};

export function calcTotals(items: LineItem[], taxRate: number, markupRate: number) {
  const subtotal = items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0);
  const markup = subtotal * (markupRate / 100);
  const tax = (subtotal + markup) * (taxRate / 100);
  const grandTotal = subtotal + markup + tax;
  return { subtotal, markup, tax, grandTotal };
}
