import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Download {
  id: string
  progress: number
  filename: string
  status: 'downloading' | 'completed' | 'error'
}

// In-memory storage for active downloads (in production, use Redis or similar)
const activeDownloads = new Map<string, Download>()

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    if (req.method === 'GET') {
      // Return all active downloads
      return new Response(
        JSON.stringify(Array.from(activeDownloads.values())),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (req.method === 'POST') {
      const { id, progress, filename, status } = await req.json()
      
      // Update download progress
      activeDownloads.set(id, { id, progress, filename, status })
      
      // Clean up completed downloads after 5 minutes
      if (status === 'completed' || status === 'error') {
        setTimeout(() => {
          activeDownloads.delete(id)
        }, 5 * 60 * 1000)
      }
      
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})