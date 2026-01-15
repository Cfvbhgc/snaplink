export interface LinkRecord {
  shortId: string;
  originalUrl: string;
  customAlias?: string;
  createdAt: string;
  expiresAt?: string;
  clicks: number;
}

export interface ClickEvent {
  timestamp: string;
  ip: string;
  userAgent: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
  country: string;
}

export interface LinkAnalytics {
  shortId: string;
  originalUrl: string;
  totalClicks: number;
  clicksOverTime: Record<string, number>;
  topReferrers: Record<string, number>;
  browsers: Record<string, number>;
  operatingSystems: Record<string, number>;
  devices: Record<string, number>;
  countries: Record<string, number>;
}

export interface CreateLinkRequest {
  url: string;
  customAlias?: string;
  expiresIn?: number; // seconds
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
