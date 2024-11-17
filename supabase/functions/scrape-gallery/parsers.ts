import { ParsedMedia } from './types';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function parseImages(html: string): ParsedMedia[] {
  const images: ParsedMedia[] = [];
  const regex = /' src="https:\/\/cdn5-thumbs\.motherlessmedia\.com\/thumbs\/([A-Z0-9]+?)\.(jpg|gif)"[\s\S]+?alt="(.+?)"/g;
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const title = match[3];
    images.push({
      id,
      url: `https://cdn5-images.motherlessmedia.com/images/${id}.jpg`,
      title,
      thumbnailUrl: `https://cdn5-thumbs.motherlessmedia.com/thumbs/${id}.jpg`
    });
  }
  
  return images;
}

export function parseVideos(html: string): ParsedMedia[] {
  const videos: ParsedMedia[] = [];
  const regex = /thumbs\/([A-Z0-9]+?)-strip\.jpg" alt="(.+?)"/g;
  
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const title = match[2];
    videos.push({
      id,
      url: `https://cdn5-videos.motherlessmedia.com/videos/${id}.mp4`,
      title,
      thumbnailUrl: `https://cdn5-thumbs.motherlessmedia.com/thumbs/${id}-strip.jpg`
    });
  }
  
  return videos;
}

export function parseMetadata(html: string) {
  const title = html.match(/<title>(.+?) \|/)?.[1] || '';
  const uploader = html.match(/gallery-member-username">[\s\S]+?<a href="\/m\/(.+?)"/)?.[1];
  const imageCount = parseInt(html.match(/Images \(([0-9,]+)\)/)?.[1]?.replace(',', '') || '0');
  const videoCount = parseInt(html.match(/Videos \(([0-9,]+)\)/)?.[1]?.replace(',', '') || '0');
  
  return {
    title,
    uploader,
    imageCount,
    videoCount
  };
}