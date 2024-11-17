import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { MotherlessExtractor } from './motherless.py';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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