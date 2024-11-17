import { supabase } from "@/integrations/supabase/client";

export interface GalleryFilters {
  minVideos?: number;
  maxVideos?: number;
  minImages?: number;
  maxImages?: number;
  minDuration?: number;
  maxDuration?: number;
  searchTerm?: string;
  pageParam?: number;
}

const ITEMS_PER_PAGE = 20;

export const fetchGalleries = async ({ pageParam = 0, ...filters }: GalleryFilters) => {
  const start = pageParam * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('cached_galleries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(start, end);

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
  if (filters.searchTerm) {
    query = query.ilike('title', `%${filters.searchTerm}%`);
  }

  const { data, error, count } = await query;
  
  if (error) throw error;
  
  return {
    data: data || [],
    pageCount: pageParam,
    hasMore: (count || 0) > (end + 1)
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