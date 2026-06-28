export const PAID_PLANS = [4, 112];
export const FREE_PLAN = 8;
export const EXIT_URL = 'https://www.itecfinder.com/login';
export const BD_API_BASE = 'https://www.itecfinder.com/api';
export const SESSION_COOKIE = 'ce_session';
export const MAX_FREE_ESTIMATES = 1;

export type MemberType = 'paid' | 'free' | 'new';

export interface SessionPayload {
  email: string;
  planId: number;
  memberType: MemberType;
}

export interface LineItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  category: 'material' | 'labor' | 'other';
}

export interface ProjectData {
  customerName: string;
  customerEmail: string;
  projectType: string;
  images: string[];
  scanResults?: ScanResult;
}

export interface ScanResult {
  roomType: string;
  dimensions: string;
  materials: string[];
  fixtures: string[];
  labor: string[];
  demolition: string[];
  suggestedLineItems: LineItem[];
}

export interface Estimate {
  id?: string;
  projectId?: string;
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  markup: number;
  grandTotal: number;
  createdAt?: string;
}

export interface Invoice {
  id?: string;
  projectId?: string;
  invoiceNumber: string;
  data: Estimate & { customerName: string; customerEmail: string; companyName: string };
  createdAt?: string;
}

export interface Contractor {
  id?: string;
  email: string;
  companyName?: string;
  phone?: string;
  address?: string;
  license?: string;
  website?: string;
  logoUrl?: string;
  membershipPlan: number;
  createdAt?: string;
}
