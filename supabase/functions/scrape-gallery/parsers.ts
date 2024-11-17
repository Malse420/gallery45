import { ParsedMedia } from './types.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import puppeteer from 'https://esm.sh/puppeteer-core@21.5.2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getChromePath() {
  // Common Chrome paths
  const paths = [
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ];
  
  for (const path of paths) {
    try {
      const stat = await Deno.stat(path);
      if (stat.isFile) {
        return path;
      }
    } catch {
      continue;
    }
  }
  
  throw new Error('Chrome not found');
}

export async function parseWithPuppeteer(url: string) {
  console.log('Launching puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: await getChromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log('Navigating to page...');
    await page.goto(url, { waitUntil: 'networkidle0' });
    
    // Wait for content to load
    await page.waitForSelector('img', { timeout: 5000 }).catch(() => console.log('No images found'));
    
    const html = await page.content();
    return html;
  } finally {
    await browser.close();
  }
}

export async function parseImages(html: string): Promise<ParsedMedia[]> {
  console.log('Parsing images from HTML');
  const images: ParsedMedia[] = [];
  const $ = load(html);
  
  // Enhanced image parsing with multiple selectors
  const imageSelectors = [
    'img[src*="cdn5-thumbs.motherlessmedia.com"]',
    'img[data-src*="cdn5-thumbs.motherlessmedia.com"]',
    'img[src*="cdn5-images.motherlessmedia.com"]',
  ];
  
  imageSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src') || '';
      const alt = $(element).attr('alt') || '';
      
      if (src) {
        const match = src.match(/\/([A-Z0-9]+)\.(jpg|gif)/i);
        if (match) {
          const id = match[1];
          images.push({
            id,
            url: `https://cdn5-images.motherlessmedia.com/images/${id}.jpg`,
            title: alt,
            thumbnailUrl: src,
          });
        }
      }
    });
  });
  
  console.log(`Found ${images.length} images`);
  return [...new Map(images.map(item => [item.id, item])).values()]; // Remove duplicates
}

export async function parseVideos(html: string): Promise<ParsedMedia[]> {
  console.log('Parsing videos from HTML');
  const videos: ParsedMedia[] = [];
  const $ = load(html);
  
  // Enhanced video parsing
  const videoSelectors = [
    'video source[src*="cdn5-videos"]',
    'img[src*="-strip.jpg"]',
    '[data-video-id]',
  ];
  
  videoSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src') || '';
      const videoId = $el.attr('data-video-id') || '';
      const title = $el.attr('alt') || $el.attr('title') || '';
      
      let id = videoId;
      if (!id) {
        const match = src.match(/([A-Z0-9]+)(?:-strip\.jpg|-thumb\.jpg|\.mp4)/i);
        if (match) id = match[1];
      }
      
      if (id) {
        videos.push({
          id,
          url: `https://cdn5-videos.motherlessmedia.com/videos/${id}.mp4`,
          title,
          thumbnailUrl: `https://cdn5-thumbs.motherlessmedia.com/thumbs/${id}-strip.jpg`,
        });
      }
    });
  });
  
  console.log(`Found ${videos.length} videos`);
  return [...new Map(videos.map(item => [item.id, item])).values()]; // Remove duplicates
}

export async function parseMetadata(html: string) {
  console.log('Parsing metadata from HTML');
  const $ = load(html);
  
  // Enhanced metadata parsing
  const title = $('title').text().split('|')[0]?.trim() || '';
  const uploader = $('.gallery-member-username a').first().text().trim();
  
  // Parse counts with multiple selector attempts
  let imageCount = 0;
  let videoCount = 0;
  
  const countText = $('.media-counts').text();
  const imageCounts = countText.match(/(\d+(?:,\d+)*)\s*Images?/i);
  const videoCounts = countText.match(/(\d+(?:,\d+)*)\s*Videos?/i);
  
  if (imageCounts) {
    imageCount = parseInt(imageCounts[1].replace(/,/g, ''));
  }
  
  if (videoCounts) {
    videoCount = parseInt(videoCounts[1].replace(/,/g, ''));
  }
  
  // Additional metadata
  const description = $('.gallery-description').text().trim();
  const tags = $('.gallery-tags a').map((_, el) => $(el).text().trim()).get();
  
  console.log('Parsed metadata:', { title, uploader, imageCount, videoCount, tags });
  return {
    title,
    uploader,
    imageCount,
    videoCount,
    description,
    tags,
  };
}