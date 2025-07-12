import * as cheerio from 'cheerio';
import { chromium } from 'playwright';

interface ScrapingResult {
  success: boolean;
  description: string;
  error?: string;
  method: 'cheerio' | 'playwright' | 'fallback';
}

export class ProspectScraper {
  private static instance: ProspectScraper;
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36';

  static getInstance(): ProspectScraper {
    if (!ProspectScraper.instance) {
      ProspectScraper.instance = new ProspectScraper();
    }
    return ProspectScraper.instance;
  }

  /**
   * Extract company description from website
   */
  async scrapeCompanyDescription(domain: string): Promise<ScrapingResult> {
    const cleanDomain = this.cleanDomain(domain);
    const url = `https://${cleanDomain}`;

    // Try Cheerio first (faster)
    try {
      const cheerioResult = await this.scrapeWithCheerio(url);
      if (cheerioResult.success && cheerioResult.description.length > 100) {
        return cheerioResult;
      }
    } catch (error) {
      console.log(`Cheerio failed for ${domain}:`, error);
    }

    // Fallback to Playwright for JavaScript-heavy sites
    try {
      const playwrightResult = await this.scrapeWithPlaywright(url);
      if (playwrightResult.success) {
        return playwrightResult;
      }
    } catch (error) {
      console.log(`Playwright failed for ${domain}:`, error);
    }

    // Final fallback
    return {
      success: false,
      description: '',
      error: 'Unable to scrape website content',
      method: 'fallback'
    };
  }

  /**
   * Fast scraping with Cheerio for static content
   */
  private async scrapeWithCheerio(url: string): Promise<ScrapingResult> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': this.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract description from multiple sources
    const descriptions: string[] = [];

    // Meta description
    const metaDesc = $('meta[name="description"]').attr('content');
    if (metaDesc && metaDesc.length > 20) {
      descriptions.push(metaDesc.trim());
    }

    // Hero section text
    const heroSelectors = [
      '.hero h1, .hero h2, .hero p',
      '.banner h1, .banner h2, .banner p',
      '.jumbotron h1, .jumbotron h2, .jumbotron p',
      'section:first-of-type h1, section:first-of-type h2, section:first-of-type p'
    ];

    for (const selector of heroSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 30 && text.length < 500) {
          descriptions.push(text);
        }
      });
    }

    // About/company sections
    const aboutSelectors = [
      '[class*="about"] p',
      '[id*="about"] p',
      '[class*="company"] p',
      '[class*="description"] p',
      '.intro p, .overview p'
    ];

    for (const selector of aboutSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && text.length < 800) {
          descriptions.push(text);
        }
      });
    }

    // Combine and clean descriptions
    const combinedDescription = descriptions
      .slice(0, 5) // Limit to first 5 relevant descriptions
      .join(' ')
      .substring(0, 2000); // Limit total length

    return {
      success: combinedDescription.length > 50,
      description: this.cleanDescription(combinedDescription),
      method: 'cheerio'
    };
  }

  /**
   * Advanced scraping with Playwright for dynamic content
   */
  private async scrapeWithPlaywright(url: string): Promise<ScrapingResult> {
    const browser = await chromium.launch({ headless: true });
    
    try {
      const context = await browser.newContext({
        userAgent: this.userAgent,
        viewport: { width: 1920, height: 1080 }
      });

      const page = await context.newPage();
      
      // Set timeout and intercept unnecessary resources
      await page.setDefaultTimeout(15000);
      await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot}', route => route.abort());
      
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Wait for potential dynamic content
      await page.waitForTimeout(2000);

      // Extract text content
      const content = await page.evaluate(() => {
        const descriptions: string[] = [];

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
        if (metaDesc && metaDesc.length > 20) {
          descriptions.push(metaDesc.trim());
        }

        // Hero/banner sections
        const heroSelectors = [
          '.hero', '.banner', '.jumbotron', 'section:first-of-type',
          '[class*="hero"]', '[class*="banner"]', '[class*="intro"]'
        ];

        for (const selector of heroSelectors) {
          const elements = document.querySelectorAll(`${selector} h1, ${selector} h2, ${selector} p`);
          elements.forEach(el => {
            const text = el.textContent?.trim() || '';
            if (text.length > 30 && text.length < 500) {
              descriptions.push(text);
            }
          });
        }

        // About sections
        const aboutSelectors = [
          '[class*="about"]', '[id*="about"]', '[class*="company"]',
          '[class*="description"]', '.intro', '.overview'
        ];

        for (const selector of aboutSelectors) {
          const elements = document.querySelectorAll(`${selector} p`);
          elements.forEach(el => {
            const text = el.textContent?.trim() || '';
            if (text.length > 50 && text.length < 800) {
              descriptions.push(text);
            }
          });
        }

        return descriptions.slice(0, 5).join(' ').substring(0, 2000);
      });

      await context.close();

      return {
        success: content.length > 50,
        description: this.cleanDescription(content),
        method: 'playwright'
      };
    } finally {
      await browser.close();
    }
  }

  /**
   * Clean and normalize domain
   */
  private cleanDomain(domain: string): string {
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/.*$/, '')
      .trim()
      .toLowerCase();
  }

  /**
   * Clean and format description text
   */
  private cleanDescription(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:()\-'"]/g, '')
      .trim()
      .substring(0, 1500); // Reasonable limit for OpenAI
  }

  /**
   * Extract domain from company name using heuristics
   */
  extractDomainFromCompanyName(companyName: string): string[] {
    const suggestions: string[] = [];
    const cleaned = companyName.toLowerCase()
      .replace(/\b(inc|corp|corporation|company|co|ltd|limited|llc|llp)\b/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();

    // Basic domain suggestions
    const words = cleaned.split(/\s+/).filter(w => w.length > 2);
    
    if (words.length === 1) {
      suggestions.push(`${words[0]}.com`);
      suggestions.push(`${words[0]}.io`);
    } else if (words.length === 2) {
      suggestions.push(`${words.join('')}.com`);
      suggestions.push(`${words[0]}${words[1]}.com`);
      suggestions.push(`${words[0]}.com`);
    } else {
      suggestions.push(`${words.slice(0, 2).join('')}.com`);
      suggestions.push(`${words[0]}.com`);
    }

    return suggestions;
  }
}

export const prospectScraper = ProspectScraper.getInstance();