export interface MediaItem {
  url: string;
  title?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  duration?: number;
  id: string;
}

export interface GalleryData {
  externalId: string;
  url: string;
  title: string;
  content: string;
  thumbnailUrl: string;
  uploader?: string;
  createdAt?: string;
  images: MediaItem[];
  videos: MediaItem[];
}

export interface ParsedMedia {
  id: string;
  url: string;
  title?: string;
  thumbnailUrl?: string;
}