import { createClient } from '@supabase/supabase-js';
import { GalleryData, MediaItem } from './types.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function insertGallery(data: GalleryData) {
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

  if (galleryError) throw galleryError;
  return gallery;
}

export async function insertImages(galleryId: string, images: MediaItem[]) {
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

    if (error) console.error('Error inserting image:', error);
  }
}

export async function insertVideos(galleryId: string, videos: MediaItem[]) {
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

    if (error) console.error('Error inserting video:', error);
  }
}