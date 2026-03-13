import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import * as cheerio from 'cheerio';
import path from 'path';

const app = express();
const PORT = 3000;

// Initialize SQLite database
const db = new Database('lootfactory.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT,
    price TEXT,
    link TEXT,
    image_url TEXT,
    posted_at DATETIME
  )
`);

// Clean up duplicate products created by the multi-link bug
try {
  db.exec(`DELETE FROM products WHERE id LIKE '%_0' OR id LIKE '%_1' OR id LIKE '%_2' OR id LIKE '%_3' OR id LIKE '%_4' OR id LIKE '%_5'`);
} catch (e) {
  // Ignore errors
}

try {
  db.exec(`ALTER TABLE products ADD COLUMN coupon TEXT`);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE products ADD COLUMN mrp TEXT`);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE products ADD COLUMN discount INTEGER`);
} catch (e) {
  // Column already exists
}

try {
  db.exec(`ALTER TABLE products ADD COLUMN links TEXT`);
} catch (e) {
  // Column already exists
}

const insertProduct = db.prepare(`
  INSERT OR REPLACE INTO products (id, title, price, link, image_url, posted_at, coupon, mrp, discount, links)
  VALUES (@id, @title, @price, @link, @image_url, @posted_at, @coupon, @mrp, @discount, @links)
`);

const getProducts = db.prepare(`
  SELECT * FROM products ORDER BY posted_at DESC LIMIT 100
`);

// Fallback image generator based on keywords
function getFallbackImage(title: string) {
  const t = title.toLowerCase();
  if (t.includes('laptop') || t.includes('macbook') || t.includes('pc')) return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80';
  if (t.includes('phone') || t.includes('mobile') || t.includes('iphone')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80';
  if (t.includes('shoe') || t.includes('sneaker') || t.includes('adidas') || t.includes('nike')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80';
  if (t.includes('shirt') || t.includes('jeans') || t.includes('clothing') || t.includes('wear')) return 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80';
  if (t.includes('watch') || t.includes('smartwatch')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80';
  if (t.includes('headphone') || t.includes('earbud') || t.includes('speaker')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
  if (t.includes('grocery') || t.includes('food') || t.includes('pantry')) return 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80';
  if (t.includes('beauty') || t.includes('makeup') || t.includes('cream') || t.includes('perfume')) return 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=800&q=80';
  if (t.includes('kitchen') || t.includes('cook') || t.includes('home')) return 'https://images.unsplash.com/photo-1556910103-1c02745a872f?w=800&q=80';
  if (t.includes('bag') || t.includes('backpack') || t.includes('luggage')) return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80';
  if (t.includes('toy') || t.includes('game') || t.includes('kids')) return 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80';
  if (t.includes('book') || t.includes('study')) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80';
  if (t.includes('health') || t.includes('medicine') || t.includes('vitamin')) return 'https://images.unsplash.com/photo-1584308666744-24d5e4a42b9e?w=800&q=80';
  
  // Default generic "Sale/Deal" image
  return 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80';
}

// Sync function
async function syncTelegramChannel() {
  const channelUsername = process.env.VITE_TELEGRAM_CHANNEL || 'FlashLootDealsx';
  if (!channelUsername) return;

  try {
    console.log(`Syncing from Telegram channel: ${channelUsername}`);
    const response = await fetch(`https://t.me/s/${channelUsername}`);
    const html = await response.text();
    const $ = cheerio.load(html);

    const messages = $('.tgme_widget_message');
    
    messages.each((_, el) => {
      const id = $(el).attr('data-post');
      if (!id) return;

      const textEl = $(el).find('.tgme_widget_message_text');
      if (!textEl.length) return;

      // Extract image
      const photoWrap = $(el).find('.tgme_widget_message_photo_wrap');
      let image_url = '';
      if (photoWrap.length) {
        const style = photoWrap.attr('style') || '';
        const match = style.match(/background-image:url\('([^']+)'\)/);
        if (match) image_url = match[1];
      }

      // Extract links
      const validLinks: {url: string, text: string}[] = [];
      textEl.find('a').each((_, a) => {
        const href = $(a).attr('href');
        // Ignore telegram internal links or hashtags
        if (href && !href.startsWith('https://t.me/') && !href.startsWith('?q=')) {
          let linkText = $(a).text().trim();
          
          // If the link text is just the URL or empty, try to get the preceding text
          if (!linkText || linkText.startsWith('http')) {
            const prev = a.prev;
            if (prev && prev.type === 'text') {
              const prevText = prev.data.trim();
              // Get the last non-empty line before the link
              const lines = prevText.split('\n').map(l => l.trim()).filter(l => l);
              
              // Search backwards for a line that has actual text (not just emojis/arrows)
              for (let i = lines.length - 1; i >= 0; i--) {
                let line = lines[i].replace(/[\:\-\>👉👇🔗]+$/, '').trim();
                if (line.length > 2) {
                  linkText = line;
                  break;
                }
              }
            }
          }
          
          // Fallback if still empty or just URL
          if (!linkText || linkText.startsWith('http')) {
             linkText = `Deal Link ${validLinks.length + 1}`;
          }

          if (!validLinks.some(l => l.url === href)) {
            validLinks.push({ url: href, text: linkText });
          }
        }
      });

      // If no external link, skip (it's not a deal)
      if (validLinks.length === 0) return;
      
      const link = validLinks[0].url; // Primary link
      const linksJson = JSON.stringify(validLinks); // All links

      // Clean text
      textEl.find('br').replaceWith('\n');
      const rawText = textEl.text();
      const lines = rawText.split('\n').map(l => l.trim()).filter(l => l);
      
      // Title is usually the first line
      const title = lines[0] || 'Deal';

      // Price extraction
      let price = 'N/A';
      const priceRegex = /(?:₹|Rs\.?|INR)\s*([\d,]+)/i;
      const priceMatch = rawText.match(priceRegex);
      if (priceMatch) {
        price = `₹${priceMatch[1]}`;
      }

      // MRP & Discount extraction
      let mrp = '';
      let discount = 0;
      const mrpRegex = /mrp\s*[:\-]?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)/i;
      const mrpMatch = rawText.match(mrpRegex);
      if (mrpMatch && priceMatch) {
        mrp = `₹${mrpMatch[1]}`;
        const mrpNum = parseInt(mrpMatch[1].replace(/,/g, ''), 10);
        const priceNum = parseInt(priceMatch[1].replace(/,/g, ''), 10);
        if (mrpNum > priceNum) {
          discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        }
      }

      // If discount wasn't found via MRP, try to find explicit "% OFF" mentions anywhere in the text
      if (discount === 0) {
        const discountRegex = /(\d+)\s*%\s*(?:off|discount|drop)/i;
        const discountMatch = rawText.match(discountRegex);
        if (discountMatch) {
          const parsedDiscount = parseInt(discountMatch[1], 10);
          if (parsedDiscount > 0 && parsedDiscount <= 100) {
            discount = parsedDiscount;
            
            // If we found a discount but no MRP, we can calculate the MRP!
            if (!mrp && priceMatch) {
              const priceNum = parseInt(priceMatch[1].replace(/,/g, ''), 10);
              const calculatedMrp = Math.round(priceNum / (1 - (discount / 100)));
              mrp = `₹${calculatedMrp.toLocaleString('en-IN')}`;
            }
          }
        }
      }

      // Date
      const timeEl = $(el).find('.tgme_widget_message_date time');
      const posted_at = timeEl.attr('datetime') || new Date().toISOString();

      // Coupon extraction
      let coupon = '';
      const couponRegex = /(?:code|coupon|apply|use)\s*:?\s*([A-Z0-9]{3,15})/i;
      const couponMatch = rawText.match(couponRegex);
      if (couponMatch) {
        coupon = couponMatch[1].toUpperCase();
      }

      // Fallback image if none found
      if (!image_url) {
        image_url = getFallbackImage(title);
      }

      insertProduct.run({
        id,
        title,
        price,
        link,
        image_url,
        posted_at,
        coupon,
        mrp,
        discount,
        links: linksJson
      });
    });
    console.log('Sync complete.');
  } catch (error) {
    console.error('Error syncing Telegram:', error);
  }
}

// Run sync on startup and every 5 minutes
syncTelegramChannel();
setInterval(syncTelegramChannel, 5 * 60 * 1000);

// API Routes
app.get('/api/products', (req, res) => {
  try {
    const products = getProducts.all();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
