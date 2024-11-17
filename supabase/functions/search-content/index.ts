import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const selectors = {
  galleries: {
    container: '.ml-gallery-thumb',
    title: '.ml-galleries-title',
    uploader: '.ml-galleries-uploader',
    thumbnail: '.static',
    counts: '.ml-galleries-info',
    link: 'a'
  },
  videos: {
    container: 'div.mobile-thumb.video',
    title: 'a.title',
    uploader: 'a.plain.uploader',
    thumbnail: 'img.static',
    duration: 'span.duration',
    views: 'span.views',
    link: 'a.title'
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type = 'galleries' } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log(`Searching for ${type} with query:`, query);

    // Construct search URL based on content type
    const encodedQuery = encodeURIComponent(query);
    let searchUrl;
    
    if (type === 'videos') {
      searchUrl = `https://motherless.com/term/videos/${encodedQuery}?term=${encodedQuery}&type=all&range=0&size=0&sort=relevance`;
    } else if (type === 'galleries') {
      searchUrl = `https://motherless.com/term/galleries/${encodedQuery}?term=${encodedQuery}&range=0&size=0&sort=relevance`;
    } else {
      throw new Error(`Unsupported search type: ${type}`);
    }

    console.log('Fetching from URL:', searchUrl);

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);
    const results = [];

    const typeSelectors = selectors[type as keyof typeof selectors];

    $(typeSelectors.container).each((_, element) => {
      const $el = $(element);
      
      // Extract common data
      const $link = $el.find(typeSelectors.link);
      const url = $link.attr('href') || '';
      const title = type === 'videos' 
        ? $link.text().trim()
        : $el.find(typeSelectors.title).text().trim();
      
      // Get thumbnail URL (try both src and data-strip-src)
      const $thumbnail = $el.find(typeSelectors.thumbnail);
      const thumbnailUrl = $thumbnail.attr('data-strip-src') || $thumbnail.attr('src') || '';
      
      // Get uploader info
      const uploader = $el.find(typeSelectors.uploader).text().trim() || 'anonymous';

      if (type === 'galleries') {
        // Parse gallery-specific data
        const countsText = $el.find(typeSelectors.counts).text().trim();
        const videosMatch = countsText.match(/(\d+)\s*videos?/i);
        const imagesMatch = countsText.match(/(\d+)\s*images?/i);
        const videoCount = videosMatch ? parseInt(videosMatch[1]) : 0;
        const imageCount = imagesMatch ? parseInt(imagesMatch[1]) : 0;

        if (url && title) {
          results.push({
            id: url.split('/').pop() || '',
            title,
            url: url.startsWith('http') ? url : `https://motherless.com${url}`,
            thumbnailUrl,
            uploader,
            videoCount,
            imageCount
          });
        }
      } else if (type === 'videos') {
        // Parse video-specific data
        const durationText = $el.find(typeSelectors.duration).text().trim();
        let duration;
        if (durationText.includes(':')) {
          const [mins, secs] = durationText.split(':').map(Number);
          duration = mins * 60 + secs;
        }

        const viewsText = $el.find(typeSelectors.views).text().trim();
        const views = parseInt(viewsText.replace(/[^0-9]/g, '')) || 0;

        if (url && title) {
          results.push({
            id: url.split('/').pop() || '',
            title,
            url: url.startsWith('http') ? url : `https://motherless.com${url}`,
            thumbnailUrl,
            uploader,
            duration,
            views
          });
        }
      }
    });

    console.log(`Found ${results.length} ${type} results`);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});