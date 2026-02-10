/**
 * Email verification service integration
 * Supports multiple providers: Hunter.io, ZeroBounce, NeverBounce
 */

export interface EmailVerificationResult {
  email: string;
  status: 'valid' | 'invalid' | 'risky' | 'unknown';
  confidence: number; // 0-100
  isDisposable?: boolean;
  isFreeProvider?: boolean;
  isRoleBased?: boolean; // info@, support@, etc.
}

export interface EmailVerificationProvider {
  verifyEmail(email: string): Promise<EmailVerificationResult>;
  verifyBatch(emails: string[]): Promise<EmailVerificationResult[]>;
}

/**
 * Hunter.io provider
 */
class HunterProvider implements EmailVerificationProvider {
  private apiKey: string;
  private baseUrl = 'https://api.hunter.io/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/email-verifier?email=${encodeURIComponent(email)}&api_key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`Hunter.io API error: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data;

      return {
        email,
        status: this.mapHunterStatus(result.status),
        confidence: result.score || 0,
        isDisposable: result.disposable || false,
        isFreeProvider: result.webmail || false,
        isRoleBased: result.accept_all || false,
      };
    } catch (error) {
      console.error('Hunter.io verification error:', error);
      return {
        email,
        status: 'unknown',
        confidence: 0,
      };
    }
  }

  async verifyBatch(emails: string[]): Promise<EmailVerificationResult[]> {
    // Hunter.io doesn't have batch endpoint, verify one by one
    const results = await Promise.all(
      emails.map(email => this.verifyEmail(email))
    );
    return results;
  }

  private mapHunterStatus(status: string): 'valid' | 'invalid' | 'risky' | 'unknown' {
    switch (status) {
      case 'valid':
        return 'valid';
      case 'invalid':
        return 'invalid';
      case 'accept_all':
      case 'webmail':
        return 'risky';
      default:
        return 'unknown';
    }
  }
}

/**
 * ZeroBounce provider
 */
class ZeroBounceProvider implements EmailVerificationProvider {
  private apiKey: string;
  private baseUrl = 'https://api.zerobounce.net/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/validate?api_key=${this.apiKey}&email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error(`ZeroBounce API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        email,
        status: this.mapZeroBounceStatus(data.status),
        confidence: this.calculateConfidence(data.status, data.sub_status),
        isDisposable: data.sub_status === 'disposable',
        isFreeProvider: data.free_email || false,
        isRoleBased: data.sub_status === 'role_based',
      };
    } catch (error) {
      console.error('ZeroBounce verification error:', error);
      return {
        email,
        status: 'unknown',
        confidence: 0,
      };
    }
  }

  async verifyBatch(emails: string[]): Promise<EmailVerificationResult[]> {
    // ZeroBounce batch API would go here
    // For now, verify one by one
    const results = await Promise.all(
      emails.map(email => this.verifyEmail(email))
    );
    return results;
  }

  private mapZeroBounceStatus(status: string): 'valid' | 'invalid' | 'risky' | 'unknown' {
    switch (status) {
      case 'valid':
        return 'valid';
      case 'invalid':
      case 'abuse':
      case 'do_not_mail':
        return 'invalid';
      case 'catch-all':
      case 'unknown':
        return 'risky';
      default:
        return 'unknown';
    }
  }

  private calculateConfidence(status: string, subStatus: string): number {
    if (status === 'valid') return 95;
    if (status === 'invalid') return 5;
    if (status === 'catch-all') return 50;
    if (subStatus === 'role_based') return 40;
    return 25;
  }
}

/**
 * NeverBounce provider
 */
class NeverBounceProvider implements EmailVerificationProvider {
  private apiKey: string;
  private baseUrl = 'https://api.neverbounce.com/v4';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/single/check?key=${this.apiKey}&email=${encodeURIComponent(email)}`
      );

      if (!response.ok) {
        throw new Error(`NeverBounce API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        email,
        status: this.mapNeverBounceStatus(data.result),
        confidence: this.calculateConfidence(data.result),
        isDisposable: data.flags?.includes('disposable_email') || false,
        isFreeProvider: data.flags?.includes('free_email_host') || false,
        isRoleBased: data.flags?.includes('role_account') || false,
      };
    } catch (error) {
      console.error('NeverBounce verification error:', error);
      return {
        email,
        status: 'unknown',
        confidence: 0,
      };
    }
  }

  async verifyBatch(emails: string[]): Promise<EmailVerificationResult[]> {
    const results = await Promise.all(
      emails.map(email => this.verifyEmail(email))
    );
    return results;
  }

  private mapNeverBounceStatus(result: string): 'valid' | 'invalid' | 'risky' | 'unknown' {
    switch (result) {
      case 'valid':
        return 'valid';
      case 'invalid':
        return 'invalid';
      case 'disposable':
      case 'catchall':
        return 'risky';
      default:
        return 'unknown';
    }
  }

  private calculateConfidence(result: string): number {
    switch (result) {
      case 'valid':
        return 95;
      case 'invalid':
        return 5;
      case 'catchall':
        return 50;
      case 'disposable':
        return 30;
      default:
        return 25;
    }
  }
}

/**
 * Email verification service factory
 */
export class EmailVerificationService {
  private provider: EmailVerificationProvider;
  private cache: Map<string, EmailVerificationResult> = new Map();

  constructor(providerName?: string, apiKey?: string) {
    const provider = providerName || process.env.EMAIL_VERIFICATION_PROVIDER || 'hunter';
    const key = apiKey || this.getApiKey(provider);

    if (!key) {
      throw new Error(`No API key found for email verification provider: ${provider}`);
    }

    switch (provider.toLowerCase()) {
      case 'hunter':
        this.provider = new HunterProvider(key);
        break;
      case 'zerobounce':
        this.provider = new ZeroBounceProvider(key);
        break;
      case 'neverbounce':
        this.provider = new NeverBounceProvider(key);
        break;
      default:
        throw new Error(`Unsupported email verification provider: ${provider}`);
    }
  }

  private getApiKey(provider: string): string | undefined {
    switch (provider.toLowerCase()) {
      case 'hunter':
        return process.env.HUNTER_API_KEY;
      case 'zerobounce':
        return process.env.ZEROBOUNCE_API_KEY;
      case 'neverbounce':
        return process.env.NEVERBOUNCE_API_KEY;
      default:
        return undefined;
    }
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    // Check cache first
    if (this.cache.has(email)) {
      return this.cache.get(email)!;
    }

    // Verify with provider
    const result = await this.provider.verifyEmail(email);

    // Cache result
    this.cache.set(email, result);

    return result;
  }

  async verifyBatch(emails: string[]): Promise<EmailVerificationResult[]> {
    // Check cache for each email
    const uncachedEmails: string[] = [];
    const results: EmailVerificationResult[] = [];

    for (const email of emails) {
      if (this.cache.has(email)) {
        results.push(this.cache.get(email)!);
      } else {
        uncachedEmails.push(email);
      }
    }

    // Verify uncached emails
    if (uncachedEmails.length > 0) {
      const newResults = await this.provider.verifyBatch(uncachedEmails);
      
      // Cache new results
      for (const result of newResults) {
        this.cache.set(result.email, result);
      }

      results.push(...newResults);
    }

    return results;
  }

  /**
   * Filter out role-based and disposable emails
   */
  filterValidEmails(results: EmailVerificationResult[]): string[] {
    return results
      .filter(r => 
        r.status === 'valid' && 
        !r.isDisposable && 
        !r.isRoleBased
      )
      .map(r => r.email);
  }

  /**
   * Get the best email from a list based on verification results
   */
  async getBestEmail(emails: string[]): Promise<string | null> {
    if (emails.length === 0) return null;
    if (emails.length === 1) return emails[0];

    const results = await this.verifyBatch(emails);
    
    // Sort by confidence score
    results.sort((a, b) => b.confidence - a.confidence);

    // Return highest confidence valid email
    const best = results.find(r => r.status === 'valid');
    return best?.email || results[0].email;
  }
}
