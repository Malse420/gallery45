import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class MotherlessExtractor {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async extract() {
    console.log('Extracting data from:', this.url);
    
    const response = await fetch(this.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract gallery data
    const title = $('title').text().split('|')[0]?.trim() || '';
    const description = $('.gallery-description').text().trim();
    const thumbnailUrl = $('.media-thumb img').first().attr('src') || '';
    
    // Parse counts
    const countText = $('.media-counts').text();
    const imageCounts = countText.match(/(\d+(?:,\d+)*)\s*Images?/i);
    const videoCounts = countText.match(/(\d+(?:,\d+)*)\s*Videos?/i);
    
    const imageCount = imageCounts ? parseInt(imageCounts[1].replace(/,/g, '')) : 0;
    const videoCount = videoCounts ? parseInt(videoCounts[1].replace(/,/g, '')) : 0;

    // Extract gallery ID from URL
    const id = this.url.split('/').pop() || '';

    return {
      id,
      url: this.url,
      title,
      description,
      thumbnailUrl,
      videoCount,
      imageCount
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Extracting gallery data from:', url);

    // Initialize the extractor
    const extractor = new MotherlessExtractor(url);
    const data = await extractor.extract();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the gallery data
    const { error: insertError } = await supabase
      .from('cached_galleries')
      .upsert({
        external_gallery_id: data.id,
        url: data.url,
        title: data.title,
        content: data.description,
        thumbnail_url: data.thumbnailUrl,
        video_count: data.videoCount,
        image_count: data.imageCount,
        last_fetched: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error storing gallery data:', insertError);
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Gallery extraction error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});