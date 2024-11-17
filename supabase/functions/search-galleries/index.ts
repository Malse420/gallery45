import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  url: string;
  title: string;
  thumbnailUrl?: string;
  videoCount?: number;
  imageCount?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      throw new Error('Search query is required');
    }

    console.log('Processing search query:', query);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if we have recent results cached
    const { data: cachedResults } = await supabase
      .from('search_results')
      .select('*')
      .eq('query', query)
      .gte('last_fetched', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (cachedResults?.length) {
      console.log('Returning cached results');
      return new Response(JSON.stringify({ results: cachedResults }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Perform the search
    const searchUrl = `https://motherless.com/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(searchUrl);
    const html = await response.text();
    const $ = load(html);

    const results: SearchResult[] = [];

    // Parse search results
    $('.thumb-container').each((_, element) => {
      const $el = $(element);
      const url = $el.find('a').attr('href') || '';
      const title = $el.find('img').attr('alt') || '';
      const thumbnailUrl = $el.find('img').attr('src') || '';
      
      // Extract counts from the title or metadata
      const countMatch = title.match(/(\d+)\s*videos?,?\s*(\d+)\s*images?/i);
      const videoCount = countMatch ? parseInt(countMatch[1]) : 0;
      const imageCount = countMatch ? parseInt(countMatch[2]) : 0;

      if (url && title) {
        results.push({
          url: `https://motherless.com${url}`,
          title,
          thumbnailUrl,
          videoCount,
          imageCount,
        });
      }
    });

    // Store results in database
    if (results.length > 0) {
      const { error } = await supabase
        .from('search_results')
        .upsert(
          results.map(result => ({
            query,
            ...result,
            last_fetched: new Date().toISOString(),
          }))
        );

      if (error) {
        console.error('Error storing search results:', error);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});