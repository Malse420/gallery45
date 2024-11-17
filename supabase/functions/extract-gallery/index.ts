import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { load } from 'https://esm.sh/cheerio@1.0.0-rc.12'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GalleryData {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  videoCount: number;
  imageCount: number;
  content?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      throw new Error('URL is required')
    }

    console.log('Extracting gallery data from:', url)

    // Fetch the gallery page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch gallery: ${response.status} ${response.statusText}`)
    }

    const html = await response.text()
    const $ = load(html)

    // Extract gallery metadata
    const title = $('title').text().split('|')[0]?.trim() || ''
    const content = $('.gallery-description').text().trim()
    const thumbnailUrl = $('.gallery-image img').first().attr('src') || ''
    
    // Extract counts
    const countText = $('.media-counts').text()
    const videoMatch = countText.match(/(\d+)\s*Videos?/i)
    const imageMatch = countText.match(/(\d+)\s*Images?/i)
    
    const videoCount = videoMatch ? parseInt(videoMatch[1]) : 0
    const imageCount = imageMatch ? parseInt(imageMatch[1]) : 0

    // Extract gallery ID from URL
    const galleryId = url.split('/').pop() || ''

    const galleryData: GalleryData = {
      id: galleryId,
      title,
      url,
      thumbnailUrl,
      videoCount,
      imageCount,
      content,
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store the gallery data
    const { error: insertError } = await supabase
      .from('cached_galleries')
      .upsert({
        external_gallery_id: galleryData.id,
        url: galleryData.url,
        title: galleryData.title,
        content: galleryData.content,
        thumbnail_url: galleryData.thumbnailUrl,
        video_count: galleryData.videoCount,
        image_count: galleryData.imageCount,
        last_fetched: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error storing gallery data:', insertError)
      throw insertError
    }

    return new Response(
      JSON.stringify({ success: true, data: galleryData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Gallery extraction error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})