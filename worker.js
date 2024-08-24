addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/analyze') {
    const { url } = await request.json()
    
    // 使用环境变量中的 YouTube API 密钥
    const youtubeApiKey = YOUTUBE_API_KEY;
    
    // 这里应该是实际的 YouTube API 调用和视频分析逻辑
    // 现在我们只返回一些模拟数据
    const videoInfo = {
      title: 'Sample Video',
      duration: '10:00',
      view_count: '1000000',
      thumbnail: 'https://example.com/thumbnail.jpg'
    }

    const viralSegments = [
      {
        analysis: {
          viral_potential: 0.8,
          summary: 'This segment has high viral potential',
          tags: ['funny', 'surprising']
        }
      }
    ]

    return new Response(JSON.stringify({ video_info: videoInfo, viral_segments: viralSegments }), {
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response('Not Found', { status: 404 })
}
