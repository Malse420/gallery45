import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MediaItem {
  url: string
  title?: string
  thumbnailUrl?: string
  width?: number
  height?: number
  sizeBytes?: number
  duration?: number
  id: string
}

interface GalleryData {
  externalId: string
  url: string
  title: string
  content: string
  thumbnailUrl: string
  uploader?: string
  createdAt?: string
  images: MediaItem[]
  videos: MediaItem[]
}

const extractMediaId = (url: string, type: 'image' | 'video'): string => {
  const pattern = type === 'image' 
    ? /images\/([A-Z0-9]+)\./
    : /videos\/([A-Z0-9]+)(?:-\w+)?\.mp4/;
  const match = url.match(pattern);
  return match ? match[1] : '';
};

const extractDate = (html: string): string | undefined => {
  // Try exact date format
  const exactDateMatch = html.match(/<span class="count">(\d{1,2}\s+\w+\s+\d{4})<\/span>/);
  if (exactDateMatch) {
    return new Date(exactDateMatch[1]).toISOString();
  }

  // Try "days ago" format
  const daysAgoMatch = html.match(/<span class="count">(\d+)\s*d\s*ago<\/span>/);
  if (daysAgoMatch) {
    const daysAgo = parseInt(daysAgoMatch[1]);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString();
  }

  return undefined;
};

const extractTags = (html: string): string[] => {
  const tagsMatch = html.match(/<div class="media-meta-tags">([\S\s]+?)<\/div>/);
  if (!tagsMatch) return [];
  
  const $ = load(tagsMatch[1]);
  return $('a')
    .map((_, el) => $(el).text().replace('#', '').trim())
    .get()
    .filter(tag => tag.length > 0);
};

const extractGalleryData = async ($: cheerio.Root, url: string): Promise<GalleryData> => {
  const title = $('title').text().split('|')[0].trim();
  const description = $('meta[name="description"]').attr('content') || '';
  const thumbnailUrl = $('meta[property="og:image"]').attr('content') || '';
  const uploader = $('.gallery-member-username a').first().text().trim();
  const createdAt = extractDate($.html());

  // Extract images
  const images: MediaItem[] = [];
  $('img[src*="motherlessmedia.com/thumbs"]').each((_, el) => {
    const $img = $(el);
    const thumbUrl = $img.attr('src') || '';
    const id = extractMediaId(thumbUrl, 'image');
    if (!id) return;

    const imageUrl = `https://cdn5-images.motherlessmedia.com/images/${id}.jpg`;
    images.push({
      id,
      url: imageUrl,
      title: $img.attr('alt'),
      thumbnailUrl: thumbUrl,
      width: parseInt($img.attr('width') || '0') || undefined,
      height: parseInt($img.attr('height') || '0') || undefined
    });
  });

  // Extract videos
  const videos: MediaItem[] = [];
  $('img[src*="-strip.jpg"]').each((_, el) => {
    const $thumb = $(el);
    const thumbUrl = $thumb.attr('src') || '';
    const id = extractMediaId(thumbUrl, 'video');
    if (!id) return;

    const videoUrl = `https://cdn5-videos.motherlessmedia.com/videos/${id}.mp4`;
    videos.push({
      id,
      url: videoUrl,
      title: $thumb.attr('alt'),
      thumbnailUrl: thumbUrl,
      // Duration will be extracted from video metadata if needed
    });
  });

  return {
    externalId: url.split('/').pop() || '',
    url,
    title,
    content: description,
    thumbnailUrl,
    uploader,
    createdAt,
    images,
    videos
  };
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Scraping URL:', url);

    // Fetch the webpage content
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);

    // Extract gallery data
    const galleryData = await extractGalleryData($, url);
    console.log(`Found ${galleryData.images.length} images and ${galleryData.videos.length} videos`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Insert gallery data
    const { data: gallery, error: galleryError } = await supabaseClient
      .from('cached_galleries')
      .upsert({
        external_gallery_id: galleryData.externalId,
        url: galleryData.url,
        title: galleryData.title,
        content: galleryData.content,
        thumbnail_url: galleryData.thumbnailUrl,
        created_at: galleryData.createdAt,
        last_fetched: new Date().toISOString()
      })
      .select('id')
      .single();

    if (galleryError) {
      console.error('Error inserting gallery:', galleryError);
      throw galleryError;
    }

    console.log('Gallery inserted:', gallery.id);

    // Insert images
    for (const image of galleryData.images) {
      const { error: imageError } = await supabaseClient
        .from('cached_images')
        .upsert({
          gallery_id: gallery.id,
          external_image_id: image.id,
          url: image.url,
          title: image.title,
          thumbnail_url: image.thumbnailUrl,
          width: image.width,
          height: image.height,
          size_bytes: image.sizeBytes
        });

      if (imageError) {
        console.error('Error inserting image:', imageError);
      }
    }

    // Insert videos
    for (const video of galleryData.videos) {
      const { error: videoError } = await supabaseClient
        .from('cached_videos')
        .upsert({
          gallery_id: gallery.id,
          external_video_id: video.id,
          url: video.url,
          title: video.title,
          thumbnail_url: video.thumbnailUrl,
          duration: video.duration,
          width: video.width,
          height: video.height,
          size_bytes: video.sizeBytes
        });

      if (videoError) {
        console.error('Error inserting video:', videoError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, galleryId: gallery.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});