/**
 * BROWSER POOL FOR PARALLEL SCRAPING
 * Eliminates singleton bottleneck
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

interface PoolOptions {
  maxBrowsers?: number;
  maxPagesPerBrowser?: number;
  pageTimeout?: number;
}

interface PooledPage {
  page: Page;
  browserId: string;
  acquiredAt: number;
}

class BrowserPool {
  private browsers: Map<string, Browser> = new Map();
  private contexts: Map<string, BrowserContext> = new Map();
  private activePages: Map<string, PooledPage> = new Map();
  private queue: Array<{
    resolve: (page: PooledPage) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  
  private maxBrowsers: number;
  private maxPagesPerBrowser: number;
  private pageTimeout: number;
  private browserCounter = 0;
  
  constructor(options: PoolOptions = {}) {
    this.maxBrowsers = options.maxBrowsers || 4;
    this.maxPagesPerBrowser = options.maxPagesPerBrowser || 3;
    this.pageTimeout = options.pageTimeout || 30000;
  }
  
  /**
   * Acquire a page from the pool
   */
  async acquirePage(): Promise<Page> {
    // Try to get available page immediately
    const availablePage = await this.findAvailablePage();
    if (availablePage) {
      return availablePage.page;
    }
    
    // Can we create a new browser?
    if (this.browsers.size < this.maxBrowsers) {
      const browser = await this.createBrowser();
      const pooledPage = await this.createPage(browser);
      return pooledPage.page;
    }
    
    // Queue for when a page becomes available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.queue.findIndex(q => q.timeout === timeout);
        if (index > -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Timeout waiting for browser page'));
      }, this.pageTimeout);
      
      this.queue.push({
        resolve: (pooledPage) => resolve(pooledPage.page),
        reject,
        timeout
      });
    });
  }
  
  /**
   * Release a page back to the pool
   */
  async releasePage(page: Page): Promise<void> {
    const pageId = this.findPageId(page);
    if (!pageId) return;
    
    const pooledPage = this.activePages.get(pageId);
    if (pooledPage) {
      try {
        await page.close();
      } catch (e) {
        // Page might already be closed
      }
      this.activePages.delete(pageId);
    }
    
    // Process queue
    this.processQueue();
  }
  
  /**
   * Execute function with auto-acquire/release
   */
  async execute<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await this.acquirePage();
    try {
      return await fn(page);
    } finally {
      await this.releasePage(page);
    }
  }
  
  /**
   * Close all browsers
   */
  async closeAll(): Promise<void> {
    // Close all pages
    for (const [pageId, pooledPage] of this.activePages) {
      try {
        await pooledPage.page.close();
      } catch (e) {}
    }
    this.activePages.clear();
    
    // Close all browsers
    for (const [id, browser] of this.browsers) {
      try {
        await browser.close();
      } catch (e) {}
    }
    this.browsers.clear();
    this.contexts.clear();
    
    // Reject queued requests
    for (const queued of this.queue) {
      clearTimeout(queued.timeout);
      queued.reject(new Error('Browser pool closing'));
    }
    this.queue = [];
  }
  
  private async findAvailablePage(): Promise<PooledPage | null> {
    // Count pages per browser
    const browserPageCounts = new Map<string, number>();
    
    for (const [_, pooledPage] of this.activePages) {
      const count = browserPageCounts.get(pooledPage.browserId) || 0;
      browserPageCounts.set(pooledPage.browserId, count + 1);
    }
    
    // Find browser with capacity
    for (const [browserId, browser] of this.browsers) {
      const currentPages = browserPageCounts.get(browserId) || 0;
      if (currentPages < this.maxPagesPerBrowser) {
        const page = await this.createPage(browser);
        return page;
      }
    }
    
    return null;
  }
  
  private async createBrowser(): Promise<Browser> {
    const browserId = `browser-${++this.browserCounter}`;
    
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ]
    });
    
    this.browsers.set(browserId, browser);
    return browser;
  }
  
  private async createPage(browser: Browser): Promise<PooledPage> {
    const browserId = this.findBrowserId(browser);
    if (!browserId) throw new Error('Browser not in pool');
    
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'en-GB',
      timezoneId: 'Europe/London'
    });
    
    const page = await context.newPage();
    const pageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const pooledPage: PooledPage = {
      page,
      browserId,
      acquiredAt: Date.now()
    };
    
    this.activePages.set(pageId, pooledPage);
    return pooledPage;
  }
  
  private findBrowserId(browser: Browser): string | undefined {
    for (const [id, b] of this.browsers) {
      if (b === browser) return id;
    }
    return undefined;
  }
  
  private findPageId(page: Page): string | undefined {
    for (const [id, pooledPage] of this.activePages) {
      if (pooledPage.page === page) return id;
    }
    return undefined;
  }
  
  private processQueue(): void {
    if (this.queue.length === 0) return;
    
    this.acquirePage()
      .then(page => {
        const queued = this.queue.shift();
        if (queued) {
          clearTimeout(queued.timeout);
          // Re-construct pooled page from page
          const pageId = this.findPageId(page);
          const pooledPage = pageId ? this.activePages.get(pageId) : undefined;
          if (pooledPage) {
            queued.resolve(pooledPage);
          } else {
            queued.reject(new Error('Page not found after acquisition'));
          }
        } else {
          // No queued request, release the page
          this.releasePage(page);
        }
      })
      .catch(() => {
        // Can't acquire page, will try again when one is released
      });
  }
}

// Global pool instance
const globalPool = new BrowserPool({
  maxBrowsers: 4,
  maxPagesPerBrowser: 3,
  pageTimeout: 30000
});

export { BrowserPool, globalPool };
