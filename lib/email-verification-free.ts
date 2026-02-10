/**
 * Free, self-hosted email verification system
 * No external API required - uses DNS/MX record checks and pattern matching
 */

import dns from 'dns';
import { promisify } from 'util';

const resolveMx = promisify(dns.resolveMx);
const resolve4 = promisify(dns.resolve4);

export interface EmailVerificationResult {
  email: string;
  isValid: boolean;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  confidence: number; // 0-100
  checks: {
    syntax: boolean;
    disposable: boolean;
    roleBased: boolean;
    domainExists: boolean;
    mxRecords: boolean;
  };
  reason?: string;
}

/**
 * List of common disposable email domains
 * Source: https://github.com/disposable/disposable-email-domains
 */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com', 'guerrillamail.com', 'mailinator.com', 'tempmail.com',
  'throwaway.email', 'yopmail.com', 'temp-mail.org', 'getnada.com',
  'maildrop.cc', 'trashmail.com', 'fakeinbox.com', 'sharklasers.com',
  'guerrillamail.info', 'grr.la', 'guerrillamail.biz', 'guerrillamail.de',
  'spam4.me', 'mailnesia.com', 'emailondeck.com', 'mintemail.com',
  'mytemp.email', 'tempail.com', 'discard.email', 'discardmail.com',
  'spamgourmet.com', 'mailcatch.com', 'mailnull.com', 'trashmail.net',
  // Add more as needed
]);

/**
 * List of common role-based email prefixes
 */
const ROLE_BASED_PREFIXES = new Set([
  'admin', 'administrator', 'info', 'support', 'help', 'sales', 'contact',
  'service', 'office', 'hello', 'team', 'mail', 'noreply', 'no-reply',
  'webmaster', 'postmaster', 'hostmaster', 'abuse', 'marketing',
  'billing', 'careers', 'jobs', 'hr', 'legal', 'privacy', 'security',
]);

/**
 * Free email providers (not necessarily bad, but lower quality for B2B)
 */
const FREE_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
  'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com', 'yandex.com',
  'gmx.com', 'live.com', 'msn.com', 'me.com', 'mac.com',
]);

/**
 * Validate email syntax using regex
 */
function validateSyntax(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }

  // Additional checks
  const [localPart, domain] = email.split('@');
  
  // Local part checks
  if (localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;
  
  // Domain checks
  if (domain.length > 255) return false;
  if (domain.startsWith('-') || domain.endsWith('-')) return false;
  
  return true;
}

/**
 * Check if email is from a disposable domain
 */
function isDisposable(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.has(domain);
}

/**
 * Check if email is role-based (info@, support@, etc.)
 */
function isRoleBased(email: string): boolean {
  const localPart = email.split('@')[0]?.toLowerCase();
  return ROLE_BASED_PREFIXES.has(localPart);
}

/**
 * Check if email is from a free provider
 */
function isFreeProvider(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return FREE_EMAIL_PROVIDERS.has(domain);
}

/**
 * Check if domain exists and has MX records
 */
async function checkDomainAndMX(domain: string): Promise<{
  domainExists: boolean;
  mxRecords: boolean;
}> {
  try {
    // Check if domain has MX records
    const mxRecords = await resolveMx(domain);
    
    return {
      domainExists: true,
      mxRecords: mxRecords && mxRecords.length > 0,
    };
  } catch (error: any) {
    // If MX lookup fails, try A record as fallback
    try {
      await resolve4(domain);
      return {
        domainExists: true,
        mxRecords: false, // Domain exists but no MX records
      };
    } catch {
      return {
        domainExists: false,
        mxRecords: false,
      };
    }
  }
}

/**
 * Verify a single email address
 */
export async function verifyEmail(email: string): Promise<EmailVerificationResult> {
  email = email.toLowerCase().trim();

  const checks = {
    syntax: false,
    disposable: false,
    roleBased: false,
    domainExists: false,
    mxRecords: false,
  };

  // 1. Syntax validation
  checks.syntax = validateSyntax(email);
  if (!checks.syntax) {
    return {
      email,
      isValid: false,
      status: 'invalid',
      confidence: 0,
      checks,
      reason: 'Invalid email syntax',
    };
  }

  // 2. Disposable email check
  checks.disposable = isDisposable(email);
  if (checks.disposable) {
    return {
      email,
      isValid: false,
      status: 'invalid',
      confidence: 10,
      checks,
      reason: 'Disposable email address',
    };
  }

  // 3. Role-based check
  checks.roleBased = isRoleBased(email);

  // 4. Domain and MX record check
  const domain = email.split('@')[1];
  const domainCheck = await checkDomainAndMX(domain);
  checks.domainExists = domainCheck.domainExists;
  checks.mxRecords = domainCheck.mxRecords;

  // Calculate confidence and status
  let confidence = 0;
  let status: 'valid' | 'invalid' | 'risky' | 'unknown' = 'unknown';
  let isValid = false;
  let reason = '';

  if (!checks.domainExists) {
    status = 'invalid';
    confidence = 5;
    reason = 'Domain does not exist';
  } else if (!checks.mxRecords) {
    status = 'risky';
    confidence = 30;
    reason = 'Domain exists but cannot receive emails (no MX records)';
  } else if (checks.roleBased) {
    status = 'risky';
    confidence = 40;
    reason = 'Role-based email address (info@, support@, etc.)';
  } else {
    status = 'valid';
    isValid = true;
    confidence = 85; // High confidence for valid emails
    reason = 'Email appears valid';
    
    // Reduce confidence slightly for free providers
    if (isFreeProvider(email)) {
      confidence = 75;
      reason = 'Valid email (free provider)';
    }
  }

  return {
    email,
    isValid,
    status,
    confidence,
    checks,
    reason,
  };
}

/**
 * Verify multiple emails in batch
 */
export async function verifyEmailBatch(emails: string[]): Promise<EmailVerificationResult[]> {
  // Process in parallel with concurrency limit
  const CONCURRENCY = 10;
  const results: EmailVerificationResult[] = [];
  
  for (let i = 0; i < emails.length; i += CONCURRENCY) {
    const batch = emails.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(email => verifyEmail(email))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Get the best email from a list
 */
export async function getBestEmail(emails: string[]): Promise<string | null> {
  if (emails.length === 0) return null;
  if (emails.length === 1) return emails[0];

  const results = await verifyEmailBatch(emails);
  
  // Filter out invalid emails
  const validEmails = results.filter(r => r.isValid || r.status === 'risky');
  
  if (validEmails.length === 0) {
    // No valid emails, return the one with highest confidence
    results.sort((a, b) => b.confidence - a.confidence);
    return results[0].email;
  }
  
  // Sort by confidence
  validEmails.sort((a, b) => b.confidence - a.confidence);
  
  return validEmails[0].email;
}

/**
 * Filter emails to only valid ones
 */
export async function filterValidEmails(emails: string[]): Promise<string[]> {
  const results = await verifyEmailBatch(emails);
  return results
    .filter(r => r.isValid && !r.checks.roleBased)
    .map(r => r.email);
}

/**
 * Add a custom disposable domain to the blocklist
 */
export function addDisposableDomain(domain: string): void {
  DISPOSABLE_DOMAINS.add(domain.toLowerCase());
}

/**
 * Add multiple disposable domains
 */
export function addDisposableDomains(domains: string[]): void {
  domains.forEach(domain => addDisposableDomain(domain));
}

/**
 * Check if a domain is in the disposable list
 */
export function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}
