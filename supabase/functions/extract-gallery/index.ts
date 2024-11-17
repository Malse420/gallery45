import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Fetch the gallery page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract gallery metadata
    const title = $('title').text().split('|')[0]?.trim() || '';
    const description = $('.gallery-description').text().trim();
    const uploader = $('.gallery-member-username a').first().text().trim();
    
    // Extract counts
    const countText = $('.media-counts').text();
    const videoCounts = countText.match(/(\d+)\s*videos?/i);
    const imageCounts = countText.match(/(\d+)\s*images?/i);
    const videoCount = videoCounts ? parseInt(videoCounts[1]) : 0;
    const imageCount = imageCounts ? parseInt(imageCounts[1]) : 0;

    // Extract thumbnail
    const thumbnailUrl = $('.media-thumb img').first().attr('src') || '';

    // Extract gallery ID from URL
    const galleryId = url.split('/').pop() || '';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the gallery data
    const { data: gallery, error: insertError } = await supabase
      .from('cached_galleries')
      .upsert({
        external_gallery_id: galleryId,
        url,
        title,
        content: description,
        thumbnail_url: thumbnailUrl,
        video_count: videoCount,
        image_count: imageCount,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing gallery data:', insertError);
      throw insertError;
    }

    // Initiate download by calling the download function
    const { error: downloadError } = await supabase.functions.invoke('download-gallery', {
      body: { galleryId: gallery.id }
    });

    if (downloadError) {
      console.error('Error initiating download:', downloadError);
      throw downloadError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: gallery,
        message: 'Gallery extracted and download initiated'
      }),
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