import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';
import { GalleryData, MediaItem } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function insertGallery(data: GalleryData) {
  console.log('Inserting gallery:', { url: data.url, title: data.title });
  
  const { data: gallery, error: galleryError } = await supabase
    .from('cached_galleries')
    .upsert({
      external_gallery_id: data.externalId,
      url: data.url,
      title: data.title,
      content: data.content,
      thumbnail_url: data.thumbnailUrl,
      created_at: data.createdAt,
      last_fetched: new Date().toISOString()
    })
    .select('id')
    .single();

  if (galleryError) {
    console.error('Error inserting gallery:', galleryError);
    throw galleryError;
  }
  
  console.log('Gallery inserted successfully:', gallery.id);
  return gallery;
}

export async function insertImages(galleryId: string, images: MediaItem[]) {
  console.log(`Inserting ${images.length} images for gallery ${galleryId}`);
  
  for (const image of images) {
    const { error } = await supabase
      .from('cached_images')
      .upsert({
        gallery_id: galleryId,
        external_image_id: image.id,
        url: image.url,
        title: image.title,
        thumbnail_url: image.thumbnailUrl,
        width: image.width,
        height: image.height,
        size_bytes: image.sizeBytes
      });

    if (error) {
      console.error('Error inserting image:', { imageId: image.id, error });
    }
  }
}

export async function insertVideos(galleryId: string, videos: MediaItem[]) {
  console.log(`Inserting ${videos.length} videos for gallery ${galleryId}`);
  
  for (const video of videos) {
    const { error } = await supabase
      .from('cached_videos')
      .upsert({
        gallery_id: galleryId,
        external_video_id: video.id,
        url: video.url,
        title: video.title,
        thumbnail_url: video.thumbnailUrl,
        duration: video.duration,
        width: video.width,
        height: video.height,
        size_bytes: video.sizeBytes
      });

    if (error) {
      console.error('Error inserting video:', { videoId: video.id, error });
    }
  }
}