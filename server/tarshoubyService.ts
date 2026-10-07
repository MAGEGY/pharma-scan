import axios from 'axios';
import * as cheerio from 'cheerio';

interface TarshoubyProduct {
  name: string;
  nameArabic?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
  availability: 'available' | 'out_of_stock' | 'prescription_required';
  imageUrl?: string;
  productUrl: string;
  manufacturer?: string;
  description?: string;
  category?: string;
  requiresPrescription: boolean;
  lastUpdated: Date;
}

interface TarshoubySearchResult {
  products: TarshoubyProduct[];
  totalCount: number;
  searchQuery: string;
  timestamp: Date;
}

export class TarshoubyService {
  private readonly baseUrl = 'https://www.alabdellatif-tarshouby.com';
  private readonly searchUrl = 'https://www.alabdellatif-tarshouby.com/en/products';
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  private readonly timeout = 15000; // 15 seconds

  // Search for products by drug name
  async searchProducts(drugName: string): Promise<TarshoubySearchResult> {
    try {
      const searchUrl = `${this.searchUrl}?search=${encodeURIComponent(drugName)}`;
      
      console.log(`Searching Tarshouby for: ${drugName}`);
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: this.timeout,
      });

      const $ = cheerio.load(response.data);
      const products = this.extractProducts($, drugName);

      return {
        products,
        totalCount: products.length,
        searchQuery: drugName,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error searching Tarshouby:', error);
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          throw new Error('Tarshouby website timeout - please try again');
        } else if (error.response?.status === 404) {
          throw new Error('Product not found on Tarshouby website');
        } else if (error.response?.status >= 500) {
          throw new Error('Tarshouby website is temporarily unavailable');
        }
      }
      throw new Error('Failed to search Tarshouby website');
    }
  }

  // Extract product information from the page
  private extractProducts($: cheerio.CheerioAPI, searchQuery: string): TarshoubyProduct[] {
    const products: TarshoubyProduct[] = [];

    // Try different selectors for product listings
    const productSelectors = [
      '.product-item',
      '.product-card',
      '.product',
      '[class*="product"]',
      '.item',
      '[class*="item"]',
    ];

    let productElements: cheerio.Cheerio<any> = $();

    // Find the most appropriate selector
    for (const selector of productSelectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        productElements = elements;
        break;
      }
    }

    if (productElements.length === 0) {
      console.log('No product elements found with common selectors');
      return products;
    }

    productElements.each((index, element) => {
      try {
        const product = this.extractProductData($, element, searchQuery);
        if (product && product.name) {
          products.push(product);
        }
      } catch (error) {
        console.error(`Error extracting product ${index}:`, error);
      }
    });

    return products;
  }

  // Extract individual product data
  private extractProductData($: cheerio.CheerioAPI, element: cheerio.Element, searchQuery: string): TarshoubyProduct | null {
    const $element = $(element);

    // Extract product name
    const nameSelectors = ['.product-name', '.title', 'h1', 'h2', 'h3', '.name', '[class*="name"]'];
    let name = '';
    
    for (const selector of nameSelectors) {
      const found = $element.find(selector).first().text().trim();
      if (found) {
        name = found;
        break;
      }
    }

    // If no name found in element, try element's text content
    if (!name) {
      name = $element.text().trim().split('\n')[0]?.trim() || '';
    }

    // Filter out irrelevant results
    if (!name || name.length < 2) {
      return null;
    }

    // Check if the name is relevant to the search query
    const nameLower = name.toLowerCase();
    const queryLower = searchQuery.toLowerCase();
    
    if (!nameLower.includes(queryLower) && !queryLower.includes(nameLower.split(' ')[0])) {
      return null;
    }

    // Extract price
    const price = this.extractPrice($element);

    // Extract image
    const imageUrl = this.extractImageUrl($element);

    // Extract product URL
    const productUrl = this.extractProductUrl($element);

    // Extract availability
    const availability = this.extractAvailability($element);

    // Extract manufacturer
    const manufacturer = this.extractManufacturer($element);

    // Extract description
    const description = this.extractDescription($element);

    // Check if prescription is required
    const requiresPrescription = this.checkPrescriptionRequired($element, name);

    return {
      name,
      price,
      originalPrice: price, // Will be updated if discount info found
      discount: undefined,
      availability,
      imageUrl,
      productUrl,
      manufacturer,
      description,
      requiresPrescription,
      lastUpdated: new Date(),
    };
  }

  // Extract price information
  private extractPrice($element: cheerio.CheerioAPI): number | undefined {
    const priceSelectors = [
      '.price',
      '.amount',
      '[class*="price"]',
      '[class*="cost"]',
      '[data-price]',
    ];

    for (const selector of priceSelectors) {
      const priceText = $element.find(selector).first().text().trim();
      const price = this.parsePrice(priceText);
      if (price !== undefined) {
        return price;
      }
    }

    // Try to find price in the element's text content
    const elementText = $element.text();
    const priceMatch = elementText.match(/(?:EGP|£|$)?\s*(\d+(?:\.\d{2})?)/i);
    if (priceMatch) {
      return parseFloat(priceMatch[1]);
    }

    return undefined;
  }

  // Parse price from text
  private parsePrice(text: string): number | undefined {
    if (!text) return undefined;

    // Remove common currency symbols and extract numbers
    const cleanText = text.replace(/[EGP£$\s,]/gi, '');
    const priceMatch = cleanText.match(/(\d+(?:\.\d{2})?)/);
    
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      return price > 0 && price < 100000 ? price : undefined;
    }

    return undefined;
  }

  // Extract image URL
  private extractImageUrl($element: cheerio.CheerioAPI): string | undefined {
    const imgSelectors = ['img', '[class*="image"]', '.photo'];
    
    for (const selector of imgSelectors) {
      const img = $element.find(selector).first();
      const src = img.attr('src') || img.attr('data-src');
      if (src) {
        return src.startsWith('http') ? src : `${this.baseUrl}${src}`;
      }
    }

    return undefined;
  }

  // Extract product URL
  private extractProductUrl($element: cheerio.CheerioAPI): string {
    const linkSelectors = ['a', '[href]'];
    
    for (const selector of linkSelectors) {
      const link = $element.find(selector).first();
      const href = link.attr('href');
      if (href) {
        return href.startsWith('http') ? href : `${this.baseUrl}${href}`;
      }
    }

    return this.searchUrl;
  }

  // Extract availability status
  private extractAvailability($element: cheerio.CheerioAPI): 'available' | 'out_of_stock' | 'prescription_required' {
    const text = $element.text().toLowerCase();
    
    if (text.includes('out of stock') || text.includes('unavailable') || text.includes('sold out')) {
      return 'out_of_stock';
    }
    
    if (text.includes('prescription') || text.includes('rx') || text.includes('prescription required')) {
      return 'prescription_required';
    }
    
    return 'available';
  }

  // Extract manufacturer information
  private extractManufacturer($element: cheerio.CheerioAPI): string | undefined {
    const manufacturerSelectors = [
      '.manufacturer',
      '.brand',
      '[class*="manufacturer"]',
      '[class*="brand"]',
    ];

    for (const selector of manufacturerSelectors) {
      const text = $element.find(selector).first().text().trim();
      if (text && text.length > 1) {
        return text;
      }
    }

    return undefined;
  }

  // Extract description
  private extractDescription($element: cheerio.CheerioAPI): string | undefined {
    const descSelectors = [
      '.description',
      '.summary',
      '[class*="description"]',
      '[class*="summary"]',
      'p',
    ];

    for (const selector of descSelectors) {
      const text = $element.find(selector).first().text().trim();
      if (text && text.length > 10 && text.length < 500) {
        return text;
      }
    }

    return undefined;
  }

  // Check if prescription is required
  private checkPrescriptionRequired($element: cheerio.CheerioAPI, name: string): boolean {
    const text = $element.text().toLowerCase();
    const prescriptionKeywords = [
      'prescription',
      'rx',
      'prescription required',
      'doctor',
      'medical',
      'pharmacy only',
    ];

    return prescriptionKeywords.some(keyword => text.includes(keyword)) ||
           name.toLowerCase().includes('prescription');
  }

  // Get detailed product information
  async getProductDetails(productUrl: string): Promise<TarshoubyProduct | null> {
    try {
      const response = await axios.get(productUrl, {
        headers: {
          'User-Agent': this.userAgent,
        },
        timeout: this.timeout,
      });

      const $ = cheerio.load(response.data);
      
      // This would need to be implemented based on the actual product page structure
      // For now, return null as detailed extraction requires page-specific selectors
      return null;
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  }

  // Check if website is accessible
  async isWebsiteAccessible(): Promise<boolean> {
    try {
      const response = await axios.get(this.baseUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error('Tarshouby website not accessible:', error);
      return false;
    }
  }

  // Get website health status
  async getWebsiteHealth(): Promise<{
    accessible: boolean;
    responseTime?: number;
    lastChecked: Date;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const accessible = await this.isWebsiteAccessible();
      const responseTime = Date.now() - startTime;
      
      return {
        accessible,
        responseTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        accessible: false,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const tarshoubyService = new TarshoubyService();
