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
    width?: number
    height?: number
    sizeBytes?: number
  }>
  videos: Array<{
    url: string
    title?: string
    thumbnailUrl?: string
    duration?: number
    width?: number
    height?: number
    sizeBytes?: number
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

    console.log('Scraping URL:', url)

    // Fetch the webpage content
    const response = await fetch(url)
    const html = await response.text()
    const $ = load(html)

    // Extract gallery data
    const galleryData: GalleryData = {
      externalId: url.split('/').pop() || Math.random().toString(36).substring(7),
      url,
      title: $('h1').first().text().trim() || $('title').text().trim(),
      content: $('meta[name="description"]').attr('content') || '',
      thumbnailUrl: $('meta[property="og:image"]').attr('content') || '',
      images: [],
      videos: []
    }

    console.log('Basic gallery data extracted:', { title: galleryData.title })

    // Find images with metadata
    $('img').each((_, el) => {
      const imgUrl = $(el).attr('src')
      if (imgUrl && !imgUrl.includes('avatar') && !imgUrl.includes('logo')) {
        // Try to get image dimensions from attributes or dataset
        const width = parseInt($(el).attr('width') || $(el).data('width') || '0')
        const height = parseInt($(el).attr('height') || $(el).data('height') || '0')
        
        galleryData.images.push({
          url: imgUrl,
          title: $(el).attr('alt'),
          thumbnailUrl: imgUrl,
          width: width || undefined,
          height: height || undefined,
          // Size will be fetched when downloading the image
          sizeBytes: undefined
        })
      }
    })

    console.log(`Found ${galleryData.images.length} images`)

    // Find videos with metadata
    $('video').each((_, el) => {
      const $video = $(el)
      const $source = $video.find('source').first()
      const videoUrl = $source.attr('src') || $video.attr('src')
      
      if (videoUrl) {
        // Try to get video metadata from attributes or dataset
        const width = parseInt($video.attr('width') || $video.data('width') || '0')
        const height = parseInt($video.attr('height') || $video.data('height') || '0')
        const duration = parseInt($video.attr('duration') || $video.data('duration') || '0')
        
        galleryData.videos.push({
          url: videoUrl,
          title: $video.attr('title') || $source.attr('title'),
          thumbnailUrl: $video.attr('poster'),
          width: width || undefined,
          height: height || undefined,
          duration: duration || undefined,
          // Size will be fetched when downloading the video
          sizeBytes: undefined
        })
      }
    })

    console.log(`Found ${galleryData.videos.length} videos`)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Insert gallery data
    const { data: gallery, error: galleryError } = await supabaseClient
      .from('cached_galleries')
      .upsert({
        external_gallery_id: galleryData.externalId,
        url: galleryData.url,
        title: galleryData.title,
        content: galleryData.content,
        thumbnail_url: galleryData.thumbnailUrl,
        last_fetched: new Date().toISOString()
      })
      .select('id')
      .single()

    if (galleryError) {
      console.error('Error inserting gallery:', galleryError)
      throw galleryError
    }

    console.log('Gallery inserted:', gallery.id)

    // Insert images
    for (const image of galleryData.images) {
      const { error: imageError } = await supabaseClient
        .from('cached_images')
        .upsert({
          gallery_id: gallery.id,
          external_image_id: image.url,
          url: image.url,
          title: image.title,
          thumbnail_url: image.thumbnailUrl,
          width: image.width,
          height: image.height,
          size_bytes: image.sizeBytes
        })

      if (imageError) {
        console.error('Error inserting image:', imageError)
      }
    }

    // Insert videos
    for (const video of galleryData.videos) {
      const { error: videoError } = await supabaseClient
        .from('cached_videos')
        .upsert({
          gallery_id: gallery.id,
          external_video_id: video.url,
          url: video.url,
          title: video.title,
          thumbnail_url: video.thumbnailUrl,
          duration: video.duration,
          width: video.width,
          height: video.height,
          size_bytes: video.sizeBytes
        })

      if (videoError) {
        console.error('Error inserting video:', videoError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, galleryId: gallery.id }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Scraping error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})