import { supabase } from "@/integrations/supabase/client";

export interface GalleryFilters {
  minVideos?: number;
  maxVideos?: number;
  minImages?: number;
  maxImages?: number;
  minDuration?: number;
  maxDuration?: number;
}

export const fetchGalleries = async (filters: GalleryFilters = {}) => {
  let query = supabase
    .from('cached_galleries')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters.minVideos) {
    query = query.gte('video_count', filters.minVideos);
  }
  if (filters.maxVideos) {
    query = query.lte('video_count', filters.maxVideos);
  }
  if (filters.minImages) {
    query = query.gte('image_count', filters.minImages);
  }
  if (filters.maxImages) {
    query = query.lte('image_count', filters.maxImages);
  }
  if (filters.minDuration) {
    query = query.gte('total_duration', filters.minDuration);
  }
  if (filters.maxDuration) {
    query = query.lte('total_duration', filters.maxDuration);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return data;
};

export const fetchGalleryDetails = async (galleryId: string) => {
  const { data: gallery, error: galleryError } = await supabase
    .from('cached_galleries')
    .select('*')
    .eq('id', galleryId)
    .single();

  if (galleryError) throw galleryError;

  const { data: videos, error: videosError } = await supabase
    .from('cached_videos')
    .select('*')
    .eq('gallery_id', galleryId);

  if (videosError) throw videosError;

  const { data: images, error: imagesError } = await supabase
    .from('cached_images')
    .select('*')
    .eq('gallery_id', galleryId);

  if (imagesError) throw imagesError;

  return {
    ...gallery,
    videos,
    images
  };
};

export const scrapeGallery = async (url: string) => {
  const response = await fetch('https://mbkvzgohhfodxfubejgd.supabase.co/functions/v1/scrape-gallery', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to scrape gallery');
  }

  return response.json();
};