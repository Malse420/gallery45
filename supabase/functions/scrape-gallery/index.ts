import { corsHeaders } from './parsers.ts';
import { parseImages, parseVideos, parseMetadata, parseWithPuppeteer } from './parsers.ts';
import { insertGallery, insertImages, insertVideos } from './database.ts';
import { GalleryData } from './types.ts';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Scraping URL:', url);

    // Use Puppeteer for dynamic content
    const html = await parseWithPuppeteer(url);

    // Enhanced parsing with better error handling
    const [metadata, images, videos] = await Promise.all([
      parseMetadata(html).catch(error => {
        console.error('Metadata parsing error:', error);
        return {};
      }),
      parseImages(html).catch(error => {
        console.error('Image parsing error:', error);
        return [];
      }),
      parseVideos(html).catch(error => {
        console.error('Video parsing error:', error);
        return [];
      }),
    ]);

    // Prepare gallery data with enhanced metadata
    const galleryData: GalleryData = {
      externalId: url.split('/').pop() || '',
      url,
      title: metadata.title || '',
      content: metadata.description || '',
      thumbnailUrl: images[0]?.thumbnailUrl || videos[0]?.thumbnailUrl || '',
      uploader: metadata.uploader,
      createdAt: new Date().toISOString(),
      images,
      videos,
      tags: metadata.tags,
    };

    // Insert data with retries
    let retries = 3;
    let gallery;
    
    while (retries > 0) {
      try {
        gallery = await insertGallery(galleryData);
        await Promise.all([
          insertImages(gallery.id, images),
          insertVideos(gallery.id, videos),
        ]);
        break;
      } catch (error) {
        console.error(`Insert attempt failed (${retries} retries left):`, error);
        retries--;
        if (retries === 0) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        galleryId: gallery.id,
        stats: {
          imagesFound: images.length,
          videosFound: videos.length,
          metadata: {
            title: metadata.title,
            uploader: metadata.uploader,
            tags: metadata.tags,
          },
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      }
    );
  }
});