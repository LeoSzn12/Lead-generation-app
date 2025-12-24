import robotsParser from 'robots-parser';

interface ScrapedData {
  emails: string[];
  phones: string[];
  ownerNames: string[];
  socialMedia: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
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
    const emails = new Set<string>();
    
    // Standard email regex
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = html.match(emailRegex) || [];
    matches.forEach(email => emails.add(email.toLowerCase()));
    
    // Extract from mailto: links
    const mailtoRegex = /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi;
    const mailtoMatches = html.matchAll(mailtoRegex);
    for (const match of mailtoMatches) {
      if (match[1]) emails.add(match[1].toLowerCase());
    }
    
    // Extract obfuscated emails (e.g., "info [at] example [dot] com")
    const obfuscatedRegex = /\b([A-Za-z0-9._%+-]+)\s*\[?\s*(?:at|@)\s*\]?\s*([A-Za-z0-9.-]+)\s*\[?\s*(?:dot|\.)\s*\]?\s*([A-Z|a-z]{2,})\b/gi;
    const obfuscatedMatches = html.matchAll(obfuscatedRegex);
    for (const match of obfuscatedMatches) {
      if (match[1] && match[2] && match[3]) {
        emails.add(`${match[1]}@${match[2]}.${match[3]}`.toLowerCase());
      }
    }
    
    // Filter out common false positives
    const filtered = Array.from(emails).filter(email => 
      !email.includes('example.com') && 
      !email.includes('domain.com') &&
      !email.includes('yoursite.com') &&
      !email.includes('sentry.io') &&
      !email.includes('wixpress.com') &&
      !email.includes('yourdomain.com') &&
      !email.includes('emailaddress.com') &&
      !email.includes('wordpress.org') &&
      !email.includes('gravatar.com') &&
      !email.includes('schema.org') &&
      !email.endsWith('.png') &&
      !email.endsWith('.jpg')
    );
    
    return filtered.slice(0, 8); // Increased limit to 8 emails
  }
  
  private extractSocialMedia(html: string, baseUrl: string): {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  } {
    const social: {
      facebook?: string;
      linkedin?: string;
      instagram?: string;
      twitter?: string;
    } = {};
    
    // Facebook
    const facebookRegex = /(?:https?:)?\/\/(?:www\.)?(?:facebook\.com|fb\.com)\/([A-Za-z0-9._-]+)/gi;
    const fbMatches = html.matchAll(facebookRegex);
    for (const match of fbMatches) {
      if (match[0] && !match[0].includes('sharer') && !match[0].includes('plugins')) {
        social.facebook = match[0].replace(/^\/\//, 'https://');
        break;
      }
    }
    
    // LinkedIn
    const linkedinRegex = /(?:https?:)?\/\/(?:www\.)?linkedin\.com\/(?:company|in)\/([A-Za-z0-9._-]+)/gi;
    const liMatches = html.matchAll(linkedinRegex);
    for (const match of liMatches) {
      if (match[0]) {
        social.linkedin = match[0].replace(/^\/\//, 'https://');
        break;
      }
    }
    
    // Instagram
    const instagramRegex = /(?:https?:)?\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/gi;
    const igMatches = html.matchAll(instagramRegex);
    for (const match of igMatches) {
      if (match[0]) {
        social.instagram = match[0].replace(/^\/\//, 'https://');
        break;
      }
    }
    
    // Twitter/X
    const twitterRegex = /(?:https?:)?\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([A-Za-z0-9_]+)/gi;
    const twMatches = html.matchAll(twitterRegex);
    for (const match of twMatches) {
      if (match[0] && !match[0].includes('intent') && !match[0].includes('share')) {
        social.twitter = match[0].replace(/^\/\//, 'https://');
        break;
      }
    }
    
    return social;
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
      socialMedia: {},
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
      result.socialMedia = this.extractSocialMedia(html, url);

      // Try to scrape multiple pages for more info
      const urlObj = new URL(url);
      const additionalPages = [
        '/about', '/about-us', '/team', '/contact', '/our-team',
        '/contact-us', '/meet-the-team', '/our-story', '/privacy-policy',
        '/staff', '/leadership', '/management', '/people'
      ];
      
      for (const page of additionalPages) {
        // Stop if we have enough data
        if (result.ownerNames.length >= 5 && result.emails.length >= 5) break;

        try {
          await this.respectDelay();
          const pageUrl = `${urlObj.protocol}//${urlObj.host}${page}`;
          const pageResponse = await fetch(pageUrl, {
            headers: { 'User-Agent': this.userAgent },
            signal: AbortSignal.timeout(8000),
          });

          if (pageResponse.ok) {
            const pageHtml = await pageResponse.text();
            
            // Extract more owner names
            if (result.ownerNames.length < 5) {
              const pageNames = this.extractOwnerNames(pageHtml);
              result.ownerNames = [...new Set([...result.ownerNames, ...pageNames])].slice(0, 5);
            }
            
            // Extract more emails
            if (result.emails.length < 8) {
              const pageEmails = this.extractEmails(pageHtml);
              result.emails = [...new Set([...result.emails, ...pageEmails])].slice(0, 8);
            }
            
            // Extract more phone numbers
            if (result.phones.length < 3) {
              const pagePhones = this.extractPhones(pageHtml);
              result.phones = [...new Set([...result.phones, ...pagePhones])].slice(0, 3);
            }
            
            // Fill in missing social media
            if (!result.socialMedia.facebook || !result.socialMedia.linkedin || 
                !result.socialMedia.instagram || !result.socialMedia.twitter) {
              const pageSocial = this.extractSocialMedia(pageHtml, url);
              result.socialMedia = {
                facebook: result.socialMedia.facebook || pageSocial.facebook,
                linkedin: result.socialMedia.linkedin || pageSocial.linkedin,
                instagram: result.socialMedia.instagram || pageSocial.instagram,
                twitter: result.socialMedia.twitter || pageSocial.twitter,
              };
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
