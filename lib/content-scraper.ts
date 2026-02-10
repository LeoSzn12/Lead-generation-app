import * as cheerio from 'cheerio';

export class ContentScraper {
  private userAgent = 'LeadGeneratorBot/1.0';

  /**
   * Fetch and extract main text content from a URL
   */
  async scrapeContent(url: string): Promise<{ title: string; content: string; cleanup: boolean }> {
    try {
      // Normalize URL
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
        },
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Get Title
      const title = $('title').text().trim() || '';

      // Clean up common clutter
      $('script').remove();
      $('style').remove();
      $('noscript').remove();
      $('iframe').remove();
      $('nav').remove();
      $('footer').remove();
      $('header').remove();
      $('aside').remove();
      $('.nav').remove();
      $('.footer').remove();
      $('.menu').remove();
      $('.ad').remove();
      $('.ads').remove();
      $('.cookie-banner').remove();
      $('.popup').remove();

      // Prioritize main content areas
      let mainContent = $('main').text();
      
      // If no <main> tag, try common content wrappers or fallback to body
      if (mainContent.length < 200) {
        mainContent = $('article').text() || $('.content').text() || $('#content').text() || $('body').text();
      }

      // Cleanup whitespace
      const cleanText = mainContent
        .replace(/\s+/g, ' ') // Collapse whitespace
        .trim();

      // Truncate to reasonable length for LLM (approx 1500 tokens)
      const truncated = cleanText.slice(0, 6000);

      return {
        title,
        content: truncated,
        cleanup: true
      };

    } catch (error: any) {
      console.error(`Error scraping content from ${url}:`, error);
      throw new Error(error.message || 'Failed to scrape website content');
    }
  }
}
