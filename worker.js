// 使用 Cloudflare Workers 原生的 fetch 事件处理
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  const path = url.pathname

  if (path === '/') {
    return new Response('Hello World!', { status: 200 })
  } else if (path === '/api/analyze') {
    return handleAnalyze(request)
  } else if (path === '/api/download-clip') {
    return handleDownloadClip(request)
  } else {
    return new Response('Not Found', { status: 404 })
  }
}

async function handleAnalyze(request) {
  const url = new URL(request.url).searchParams.get('url')
  if (!url) {
    return new Response(JSON.stringify({ error: 'Missing video URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const videoId = extractVideoId(url)
  if (!videoId) {
    return new Response(JSON.stringify({ error: 'Invalid video URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const videoDetails = await getVideoDetails(videoId, YOUTUBE_API_KEY)
    const analysis = await analyzeVideoWithGemini(videoDetails, GEMINI_API_KEY)
    const clipSuggestions = parseClipSuggestions(analysis)

    return new Response(JSON.stringify({ videoDetails, clipSuggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

async function handleDownloadClip(request) {
  const url = new URL(request.url)
  const videoId = url.searchParams.get('videoId')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')
  
  if (!videoId || !start || !end) {
    return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const clipUrl = await downloadAndMergeClip(videoId, start, end)
    return new Response(JSON.stringify({ clipUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

function extractVideoId(url) {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  const bilibiliRegex = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/
  
  let match = url.match(youtubeRegex)
  if (match) return match[1]
  
  match = url.match(bilibiliRegex)
  if (match) return match[1]
  
  return null
}

async function getVideoDetails(videoId, apiKey) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`)
  const data = await response.json()

  if (data.items && data.items.length > 0) {
    const item = data.items[0]
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle
    }
  } else {
    throw new Error('Video not found')
  }
}

async function analyzeVideoWithGemini(videoDetails, apiKey) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Analyze the following video content and suggest 3-5 viral short video clips:
                 Title: ${videoDetails.title}
                 Description: ${videoDetails.description}
                 Duration: ${videoDetails.duration}
                 Channel: ${videoDetails.channelTitle}

                 For each suggested clip, provide:
                 1. A catchy title
                 2. Start and end timestamps in seconds
                 3. Brief explanation of why it could be viral`
        }]
      }]
    })
  })

  const data = await response.json()
  return data.candidates[0].content.parts[0].text
}

function parseClipSuggestions(analysis) {
  const suggestions = analysis.split('\n\n')
  return suggestions.map(suggestion => {
    const lines = suggestion.split('\n')
    return {
      title: lines[0].replace(/^\d+\.\s*/, ''),
      timestamps: lines[1].match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/).slice(1).map(Number),
      explanation: lines[2]
    }
  })
}

async function downloadAndMergeClip(videoId, start, end) {
  const mockClipUrl = `https://example.com/clips/${videoId}_${start}_${end}.mp4`
  return mockClipUrl
}
