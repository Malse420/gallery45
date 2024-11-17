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
    const { galleryId } = await req.json();
    
    if (!galleryId) {
      throw new Error('Gallery ID is required');
    }

    console.log('Starting download for gallery:', galleryId);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get gallery data
    const { data: gallery, error: galleryError } = await supabase
      .from('cached_galleries')
      .select('*')
      .eq('id', galleryId)
      .single();

    if (galleryError) {
      throw galleryError;
    }

    // Create download progress entry
    const { data: progress, error: progressError } = await supabase
      .from('download_progress')
      .insert({
        filename: gallery.title || `Gallery ${gallery.external_gallery_id}`,
        progress: 0,
        status: 'downloading'
      })
      .select()
      .single();

    if (progressError) {
      throw progressError;
    }

    // Fetch gallery page to extract media URLs
    const response = await fetch(gallery.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch gallery page: ${response.status}`);
    }

    const html = await response.text();
    const $ = load(html);

    // Extract image and video URLs
    const images = new Set();
    const videos = new Set();

    // Extract images
    $('img[src*="cdn5-images"], img[data-src*="cdn5-images"]').each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src') || '';
      const match = src.match(/\/([A-Z0-9]+)\.(jpg|gif)/i);
      if (match) {
        const id = match[1];
        images.add({
          id,
          url: `https://cdn5-images.motherlessmedia.com/images/${id}.jpg`,
          thumbnailUrl: src
        });
      }
    });

    // Extract videos
    $('video source[src*="cdn5-videos"], [data-video-id]').each((_, element) => {
      const $el = $(element);
      const src = $el.attr('src') || '';
      const videoId = $el.attr('data-video-id') || '';
      let id = videoId;
      
      if (!id) {
        const match = src.match(/([A-Z0-9]+)\.mp4/i);
        if (match) id = match[1];
      }
      
      if (id) {
        videos.add({
          id,
          url: `https://cdn5-videos.motherlessmedia.com/videos/${id}.mp4`,
          thumbnailUrl: `https://cdn5-thumbs.motherlessmedia.com/thumbs/${id}-strip.jpg`
        });
      }
    });

    // Insert media into database
    const mediaPromises = [];
    let totalItems = images.size + videos.size;
    let processedItems = 0;

    // Insert images
    for (const image of images) {
      mediaPromises.push(
        supabase
          .from('cached_images')
          .upsert({
            gallery_id: galleryId,
            external_image_id: image.id,
            url: image.url,
            thumbnail_url: image.thumbnailUrl
          })
          .then(() => {
            processedItems++;
            // Update progress
            return supabase
              .from('download_progress')
              .update({
                progress: Math.round((processedItems / totalItems) * 100)
              })
              .eq('id', progress.id);
          })
      );
    }

    // Insert videos
    for (const video of videos) {
      mediaPromises.push(
        supabase
          .from('cached_videos')
          .upsert({
            gallery_id: galleryId,
            external_video_id: video.id,
            url: video.url,
            thumbnail_url: video.thumbnailUrl
          })
          .then(() => {
            processedItems++;
            // Update progress
            return supabase
              .from('download_progress')
              .update({
                progress: Math.round((processedItems / totalItems) * 100)
              })
              .eq('id', progress.id);
          })
      );
    }

    // Wait for all media to be processed
    await Promise.all(mediaPromises);

    // Mark download as completed
    await supabase
      .from('download_progress')
      .update({
        progress: 100,
        status: 'completed'
      })
      .eq('id', progress.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Gallery download completed',
        stats: {
          images: images.size,
          videos: videos.size
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});