/**
 * Free Scraping API Fallbacks
 * These are used when all other free APIs fail
 * 
 * Free tiers:
 * - ScraperAPI: 1,000 credits/month
 * - ScrapingBee: 1,000 credits (one-time)
 * - ScrapingAnt: 1,000 calls/month
 */

export interface ScrapingParams {
  url: string;
  waitFor?: string;
  extract?: string[];
}

export class ScrapingFallbacks {
  private scraperApiKey: string;
  private scrapingBeeKey: string;
  private scrapingAntKey: string;

  constructor() {
    this.scraperApiKey = process.env.SCRAPERAPI_KEY || '';
    this.scrapingBeeKey = process.env.SCRAPINGBEE_KEY || '';
    this.scrapingAntKey = process.env.SCRAPINGANT_KEY || '';
  }

  /**
   * Try to scrape using available free APIs in order
   */
  async scrape(params: ScrapingParams): Promise<{ html: string; source: string }> {
    const errors: string[] = [];

    // Try ScraperAPI first (1,000/month, renewable)
    if (this.scraperApiKey) {
      try {
        const result = await this.scrapeWithScraperAPI(params);
        return { html: result, source: 'scraperapi' };
      } catch (error) {
        errors.push(`ScraperAPI: ${error}`);
      }
    }

    // Try ScrapingBee (1,000 one-time)
    if (this.scrapingBeeKey) {
      try {
        const result = await this.scrapeWithScrapingBee(params);
        return { html: result, source: 'scrapingbee' };
      } catch (error) {
        errors.push(`ScrapingBee: ${error}`);
      }
    }

    // Try ScrapingAnt (1,000/month)
    if (this.scrapingAntKey) {
      try {
        const result = await this.scrapeWithScrapingAnt(params);
        return { html: result, source: 'scrapingant' };
      } catch (error) {
        errors.push(`ScrapingAnt: ${error}`);
      }
    }

    throw new Error(`All scraping APIs failed: ${errors.join('; ')}`);
  }

  /**
   * ScraperAPI - 1,000 free credits/month
   * https://www.scraperapi.com/
   */
  private async scrapeWithScraperAPI(params: ScrapingParams): Promise<string> {
    const url = new URL('https://api.scraperapi.com/');
    url.searchParams.append('api_key', this.scraperApiKey);
    url.searchParams.append('url', params.url);
    url.searchParams.append('render', 'true');
    
    if (params.waitFor) {
      url.searchParams.append('wait_for_selector', params.waitFor);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`ScraperAPI error: ${response.status}`);
    }

    return await response.text();
  }

  /**
   * ScrapingBee - 1,000 free credits (one-time trial)
   * https://www.scrapingbee.com/
   */
  private async scrapeWithScrapingBee(params: ScrapingParams): Promise<string> {
    const url = new URL('https://app.scrapingbee.com/api/v1/');
    url.searchParams.append('api_key', this.scrapingBeeKey);
    url.searchParams.append('url', params.url);
    url.searchParams.append('render_js', 'true');
    
    if (params.waitFor) {
      url.searchParams.append('wait_for', params.waitFor);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`ScrapingBee error: ${response.status}`);
    }

    return await response.text();
  }

  /**
   * ScrapingAnt - 1,000 free calls/month
   * https://scrapingant.com/
   */
  private async scrapeWithScrapingAnt(params: ScrapingParams): Promise<string> {
    const url = new URL('https://api.scrapingant.com/v2/general');
    url.searchParams.append('url', params.url);
    url.searchParams.append('x-api-key', this.scrapingAntKey);
    url.searchParams.append('browser', 'true');
    
    if (params.waitFor) {
      url.searchParams.append('wait_for_selector', params.waitFor);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`ScrapingAnt error: ${response.status}`);
    }

    return await response.text();
  }

  /**
   * Check if any fallback is available
   */
  hasAvailableFallback(): boolean {
    return !!(this.scraperApiKey || this.scrapingBeeKey || this.scrapingAntKey);
  }

  /**
   * Get status of all fallbacks
   */
  getStatus(): { name: string; available: boolean }[] {
    return [
      { name: 'ScraperAPI', available: !!this.scraperApiKey },
      { name: 'ScrapingBee', available: !!this.scrapingBeeKey },
      { name: 'ScrapingAnt', available: !!this.scrapingAntKey },
    ];
  }
}

export const scrapingFallbacks = new ScrapingFallbacks();
