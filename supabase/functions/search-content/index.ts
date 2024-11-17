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
    duration: 'span',
    views: 'span.hits',
    link: 'a.title'
  },
  images: {
    container: '.image-item',
    link: 'a.image-link',
    title: '.image-title',
    thumbnail: 'img.image-thumb',
    views: '.views-count',
    date: '.upload-date'
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

    // Construct the appropriate search URL based on content type
    let searchUrl;
    if (type === 'videos') {
      searchUrl = `https://motherless.com/term/videos/${encodeURIComponent(query)}?term=${encodeURIComponent(query)}&type=all&range=0&size=0&sort=relevance`;
    } else if (type === 'galleries') {
      searchUrl = `https://motherless.com/term/galleries/${encodeURIComponent(query)}?term=${encodeURIComponent(query)}&range=0&size=0&sort=relevance`;
    } else {
      searchUrl = `https://motherless.com/term/${type}?t=${type}&q=${encodeURIComponent(query)}`;
    }

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
      const $link = $el.find(typeSelectors.link);
      const url = $link.attr('href') || '';
      
      let title;
      if (type === 'videos') {
        title = $link.text().trim();
      } else if (type === 'galleries') {
        title = $el.find(typeSelectors.title).text().trim();
      } else {
        title = $el.find(typeSelectors.title).text().trim();
      }
      
      const thumbnailUrl = $el.find(typeSelectors.thumbnail).attr('src') || 
                          $el.find(typeSelectors.thumbnail).attr('data-strip-src') || '';
      
      let duration;
      if (type === 'videos') {
        const durationText = $el.find(typeSelectors.duration).first().text().trim();
        if (durationText.includes(':')) {
          const [mins, secs] = durationText.split(':').map(Number);
          duration = mins * 60 + secs;
        }
      }

      // Parse counts for galleries
      let videoCount, imageCount;
      if (type === 'galleries') {
        const countsText = $el.find(typeSelectors.counts).text().trim();
        const videosMatch = countsText.match(/(\d+)\s*videos?/i);
        const imagesMatch = countsText.match(/(\d+)\s*images?/i);
        videoCount = videosMatch ? parseInt(videosMatch[1]) : 0;
        imageCount = imagesMatch ? parseInt(imagesMatch[1]) : 0;
      }

      const views = parseInt($el.find(typeSelectors.views || '').text().replace(/[^0-9]/g, '')) || undefined;
      const uploader = type === 'videos' 
        ? $el.find(typeSelectors.uploader).text().trim() || 'anonymous'
        : type === 'galleries'
          ? $el.find(typeSelectors.uploader).text().trim() || 'anonymous'
          : undefined;

      if (url && title) {
        results.push({
          id: url.split('/').pop() || '',
          title,
          url: url.startsWith('http') ? url : `https://motherless.com${url}`,
          thumbnailUrl,
          duration,
          views,
          uploader,
          ...(type === 'galleries' && { videoCount, imageCount })
        });
      }
    });

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