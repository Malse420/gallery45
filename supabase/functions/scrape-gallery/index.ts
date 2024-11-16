import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GalleryData {
  externalId: string
  url: string
  title: string
  content: string
  thumbnailUrl: string
  images: Array<{
    url: string
    title?: string
    thumbnailUrl?: string
  }>
  videos: Array<{
    url: string
    title?: string
    thumbnailUrl?: string
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    if (!url) {
      throw new Error('URL is required')
    }

    // Fetch the webpage content
    const response = await fetch(url)
    const html = await response.text()
    const $ = load(html)

    // Extract gallery data (this is a basic example, adjust selectors based on target site)
    const galleryData: GalleryData = {
      externalId: url.split('/').pop() || Math.random().toString(36).substring(7),
      url,
      title: $('h1').first().text().trim() || $('title').text().trim(),
      content: $('meta[name="description"]').attr('content') || '',
      thumbnailUrl: $('meta[property="og:image"]').attr('content') || '',
      images: [],
      videos: []
    }

    // Find images (adjust selectors as needed)
    $('img').each((_, el) => {
      const imgUrl = $(el).attr('src')
      if (imgUrl && !imgUrl.includes('avatar') && !imgUrl.includes('logo')) {
        galleryData.images.push({
          url: imgUrl,
          title: $(el).attr('alt'),
          thumbnailUrl: imgUrl
        })
      }
    })

    // Find videos (adjust selectors as needed)
    $('video source').each((_, el) => {
      const videoUrl = $(el).attr('src')
      if (videoUrl) {
        galleryData.videos.push({
          url: videoUrl,
          title: $(el).parent().attr('title'),
          thumbnailUrl: $(el).parent().attr('poster')
        })
      }
    })

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert gallery data
    const { data: gallery, error: galleryError } = await supabaseClient
      .rpc('upsert_gallery', {
        p_external_gallery_id: galleryData.externalId,
        p_url: galleryData.url,
        p_title: galleryData.title,
        p_content: galleryData.content,
        p_thumbnail_url: galleryData.thumbnailUrl
      })

    if (galleryError) throw galleryError

    // Insert images
    for (const image of galleryData.images) {
      await supabaseClient
        .from('cached_images')
        .upsert({
          gallery_id: gallery,
          external_image_id: image.url,
          url: image.url,
          title: image.title,
          thumbnail_url: image.thumbnailUrl
        })
    }

    // Insert videos
    for (const video of galleryData.videos) {
      await supabaseClient
        .from('cached_videos')
        .upsert({
          gallery_id: gallery,
          external_video_id: video.url,
          url: video.url,
          title: video.title,
          thumbnail_url: video.thumbnailUrl
        })
    }

    return new Response(
      JSON.stringify({ success: true, galleryId: gallery }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})