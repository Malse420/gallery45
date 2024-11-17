import { supabase } from "@/integrations/supabase/client";

export interface GalleryFilters {
  minVideos?: number;
  maxVideos?: number;
  minImages?: number;
  maxImages?: number;
  minDuration?: number;
  maxDuration?: number;
  searchTerm?: string;
  page?: number;
}

const ITEMS_PER_PAGE = 20;

export const fetchGalleries = async (filters: GalleryFilters = {}) => {
  const { page = 1, ...restFilters } = filters;
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('cached_galleries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end);

  if (restFilters.minVideos) {
    query = query.gte('video_count', restFilters.minVideos);
  }
  if (restFilters.maxVideos) {
    query = query.lte('video_count', restFilters.maxVideos);
  }
  if (restFilters.minImages) {
    query = query.gte('image_count', restFilters.minImages);
  }
  if (restFilters.maxImages) {
    query = query.lte('image_count', restFilters.maxImages);
  }
  if (restFilters.minDuration) {
    query = query.gte('total_duration', restFilters.minDuration);
  }
  if (restFilters.maxDuration) {
    query = query.lte('total_duration', restFilters.maxDuration);
  }
  if (restFilters.searchTerm) {
    query = query.ilike('title', `%${restFilters.searchTerm}%`);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    data,
    pageCount: Math.ceil((count || 0) / ITEMS_PER_PAGE),
    hasMore: (count || 0) > (page * ITEMS_PER_PAGE)
  };
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
