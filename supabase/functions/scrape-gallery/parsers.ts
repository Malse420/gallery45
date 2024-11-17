import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export async function parseWithFetch(url: string) {
  console.log('Fetching page content...');
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
  }
  
  return await response.text();
}

export async function parseImages(html: string) {
  console.log('Parsing images from HTML');
  const images = new Set();
  const $ = load(html);
  
  const imageSelectors = [
    'img[src*="cdn5-thumbs"]',
    'img[data-src*="cdn5-thumbs"]',
    'img[src*="cdn5-images"]'
  ];
  
  imageSelectors.forEach(selector => {
    $(selector).each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src') || '';
      const alt = $(element).attr('alt') || '';
      
      if (src) {
        const match = src.match(/\/([A-Z0-9]+)\.(jpg|gif)/i);
        if (match) {
          const id = match[1];
          images.add({
            id,
            url: `https://cdn5-images.motherlessmedia.com/images/${id}.jpg`,
            title: alt,
            thumbnailUrl: src,
          });
        }
      }
    });
  });
  
  return Array.from(images);
}

export async function parseVideos(html: string) {
  console.log('Parsing videos from HTML');
  const videos = new Set();
  const $ = load(html);
  
  const videoSelectors = [
    'video source[src*="cdn5-videos"]',
    'img[src*="-strip.jpg"]',
    '[data-video-id]'
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
        videos.add({
          id,
          url: `https://cdn5-videos.motherlessmedia.com/videos/${id}.mp4`,
          title,
          thumbnailUrl: `https://cdn5-thumbs.motherlessmedia.com/thumbs/${id}-strip.jpg`,
        });
      }
    });
  });
  
  return Array.from(videos);
}

export async function parseMetadata(html: string) {
  console.log('Parsing metadata from HTML');
  const $ = load(html);
  
  const title = $('title').text().split('|')[0]?.trim() || '';
  const uploader = $('.gallery-member-username a').first().text().trim();
  const description = $('.gallery-description').text().trim();
  const tags = $('.gallery-tags a').map((_, el) => $(el).text().trim()).get();
  
  // Parse counts
  const countText = $('.media-counts').text();
  const imageCounts = countText.match(/(\d+(?:,\d+)*)\s*Images?/i);
  const videoCounts = countText.match(/(\d+(?:,\d+)*)\s*Videos?/i);
  
  const imageCount = imageCounts ? parseInt(imageCounts[1].replace(/,/g, '')) : 0;
  const videoCount = videoCounts ? parseInt(videoCounts[1].replace(/,/g, '')) : 0;
  
  return {
    title,
    uploader,
    description,
    tags,
    imageCount,
    videoCount
  };
}