import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  views?: number;
  uploadDate?: string;
}

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
    container: '.ml-video-thumb',
    title: '.ml-video-title',
    uploader: '.ml-video-uploader', 
    thumbnail: '.static',
    duration: '.ml-video-duration',
    views: '.ml-video-views',
    link: 'a'
  },
  images: {
    container: '.ml-image-thumb',
    title: '.ml-image-title',
    uploader: '.ml-image-uploader',
    thumbnail: '.static',
    views: '.ml-image-views',
    link: 'a'
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

    const searchUrl = `https://motherless.com/search?q=${encodeURIComponent(query)}&t=${type}`;
    
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
    const results: SearchResult[] = [];

    const typeSelectors = selectors[type as keyof typeof selectors];

    $(typeSelectors.container).each((_, element) => {
      const $el = $(element);
      const $link = $el.find(typeSelectors.link);
      const url = $link.attr('href') || '';
      const title = $el.find(typeSelectors.title).text().trim() || 
                   $el.find(typeSelectors.thumbnail).attr('alt') || '';
      const thumbnailUrl = $el.find(typeSelectors.thumbnail).attr('src') || '';
      
      let duration;
      if (type === 'videos' && typeSelectors.duration) {
        const durationText = $el.find(typeSelectors.duration).text().trim();
        if (durationText) {
          const [mins, secs] = durationText.split(':').map(Number);
          duration = mins * 60 + secs;
        }
      }

      const views = parseInt($el.find(typeSelectors.views || '').text().replace(/[^0-9]/g, '')) || undefined;
      const uploadDate = $el.find(typeSelectors.uploader || '').text().trim() || undefined;

      if (url && title) {
        results.push({
          id: url.split('/').pop() || '',
          title,
          url: url.startsWith('http') ? url : `https://motherless.com${url}`,
          thumbnailUrl,
          duration,
          views,
          uploadDate
        });
      }
    });

    // Store results in Supabase for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (results.length > 0) {
      await supabase
        .from('search_results')
        .upsert(
          results.map(result => ({
            query,
            ...result,
            last_fetched: new Date().toISOString(),
          }))
        );
    }

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