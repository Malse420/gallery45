import { corsHeaders } from './parsers';
import { parseImages, parseVideos, parseMetadata } from './parsers';
import { insertGallery, insertImages, insertVideos } from './database';
import { GalleryData } from './types';

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

    // Parse metadata and media
    const metadata = parseMetadata(html);
    const images = parseImages(html);
    const videos = parseVideos(html);

    // Prepare gallery data
    const galleryData: GalleryData = {
      externalId: url.split('/').pop() || '',
      url,
      title: metadata.title,
      content: '',
      thumbnailUrl: images[0]?.thumbnailUrl || videos[0]?.thumbnailUrl || '',
      uploader: metadata.uploader,
      createdAt: new Date().toISOString(),
      images,
      videos
    };

    // Insert data into database
    const gallery = await insertGallery(galleryData);
    await Promise.all([
      insertImages(gallery.id, images),
      insertVideos(gallery.id, videos)
    ]);

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