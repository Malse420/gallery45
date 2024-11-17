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

    // Construct search URL based on type
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

    // Different selectors based on content type
    const selector = type === 'galleries' ? '.gallery-item' : '.thumb-container';

    $(selector).each((_, element) => {
      const $el = $(element);
      const url = $el.find('a').first().attr('href') || '';
      const title = $el.find('img').attr('alt') || $el.find('.title').text().trim();
      const thumbnailUrl = $el.find('img').attr('src') || '';
      
      let duration;
      const durationText = $el.find('.duration').text().trim();
      if (durationText) {
        const [mins, secs] = durationText.split(':').map(Number);
        duration = mins * 60 + secs;
      }

      if (url && title) {
        results.push({
          id: url.split('/').pop() || '',
          title,
          url: url.startsWith('http') ? url : `https://motherless.com${url}`,
          thumbnailUrl,
          duration,
          views: parseInt($el.find('.views').text().replace(/[^0-9]/g, '')) || undefined,
          uploadDate: $el.find('.uploaded').text().trim() || undefined
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