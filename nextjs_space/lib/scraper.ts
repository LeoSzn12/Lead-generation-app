import robotsParser from 'robots-parser';

interface ScrapedData {
  emails: string[];
  phones: string[];
  ownerNames: string[];
}

export class WebScraper {
  private userAgent = 'LeadGeneratorBot/1.0';
  private delay = 2500; // 2.5 seconds between requests
  private lastRequestTime = 0;

  private async respectDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.delay) {
      await new Promise(resolve => setTimeout(resolve, this.delay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  private async checkRobotsTxt(url: string): Promise<boolean> {
    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      const response = await fetch(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const robotsTxt = await response.text();
        const robots = robotsParser(robotsUrl, robotsTxt);
        return robots.isAllowed(url, this.userAgent) ?? true;
      }
      return true; // If no robots.txt, assume allowed
    } catch (error) {
      console.log('Error checking robots.txt:', error);
      return true; // On error, assume allowed
    }
  }

  private extractEmails(html: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = html.match(emailRegex) || [];
    // Filter out common false positives
    return [...new Set(emails)].filter(email => 
      !email.includes('example.com') && 
      !email.includes('domain.com') &&
      !email.includes('yoursite.com') &&
      !email.includes('sentry.io') &&
      !email.includes('wixpress.com')
    ).slice(0, 5); // Limit to 5 emails
  }

  private extractPhones(html: string): string[] {
    // Match various phone formats
    const phoneRegex = /(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})/g;
    const phones = html.match(phoneRegex) || [];
    return [...new Set(phones)].slice(0, 3); // Limit to 3 phones
  }

  private extractOwnerNames(html: string): string[] {
    const names: string[] = [];
    const lowerHtml = html.toLowerCase();

    // Look for owner/founder patterns
    const ownerPatterns = [
      /(?:owner|founder|ceo|president|director)\s*[:\-]?\s*([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+)\s*[,\-]?\s*(?:owner|founder|ceo|president)/gi,
      /(?:dr\.?|doctor)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
    ];

    for (const pattern of ownerPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          names.push(match[1].trim());
        }
      }
    }

    // Look in About/Team sections
    if (lowerHtml.includes('about') || lowerHtml.includes('team') || lowerHtml.includes('our story')) {
      const namePattern = /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g;
      const matches = html.matchAll(namePattern);
      let count = 0;
      for (const match of matches) {
        if (count >= 3) break;
        const name = match[1]?.trim();
        if (name && !names.includes(name) && name.length < 30) {
          names.push(name);
          count++;
        }
      }
    }

    return [...new Set(names)].slice(0, 5); // Limit to 5 names
  }

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    const result: ScrapedData = {
      emails: [],
      phones: [],
      ownerNames: [],
    };

    try {
      // Normalize URL
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      // Check robots.txt
      const allowed = await this.checkRobotsTxt(url);
      if (!allowed) {
        console.log(`Scraping not allowed by robots.txt for ${url}`);
        return result;
      }

      // Respect rate limiting
      await this.respectDelay();

      // Fetch main page
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.log(`Failed to fetch ${url}: ${response.status}`);
        return result;
      }

      const html = await response.text();

      // Extract data from main page
      result.emails = this.extractEmails(html);
      result.phones = this.extractPhones(html);
      result.ownerNames = this.extractOwnerNames(html);

      // Try to scrape About/Contact pages for more info
      const urlObj = new URL(url);
      const aboutPages = ['/about', '/about-us', '/team', '/contact', '/our-team'];
      
      for (const page of aboutPages) {
        if (result.ownerNames.length >= 3) break; // Stop if we have enough names

        try {
          await this.respectDelay();
          const pageUrl = `${urlObj.protocol}//${urlObj.host}${page}`;
          const pageResponse = await fetch(pageUrl, {
            headers: { 'User-Agent': this.userAgent },
            signal: AbortSignal.timeout(8000),
          });

          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            const pageNames = this.extractOwnerNames(pageHtml);
            result.ownerNames = [...new Set([...result.ownerNames, ...pageNames])].slice(0, 5);
            
            if (result.emails.length < 2) {
              const pageEmails = this.extractEmails(pageHtml);
              result.emails = [...new Set([...result.emails, ...pageEmails])].slice(0, 5);
            }
          }
        } catch (error) {
          // Continue to next page on error
          continue;
        }
      }

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
    }

    return result;
  }
}
