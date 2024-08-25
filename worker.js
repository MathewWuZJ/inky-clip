// @ts-ignore
export { };

import { Hono } from 'https://cdn.jsdelivr.net/npm/hono@3.5.0/dist/index.js'

const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))

app.get('/api/analyze', async (c) => {
  const url = c.req.query('url');
  if (!url) {
    return c.json({ error: 'Missing video URL' }, 400);
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return c.json({ error: 'Invalid video URL' }, 400);
  }

  try {
    const videoDetails = await getVideoDetails(videoId, c.env.YOUTUBE_API_KEY);
    const analysis = await analyzeVideoWithGemini(videoDetails, c.env.GEMINI_API_KEY);
    const clipSuggestions = parseClipSuggestions(analysis);

    return c.json({ videoDetails, clipSuggestions });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/download-clip', async (c) => {
  const { videoId, start, end } = c.req.query();
  if (!videoId || !start || !end) {
    return c.json({ error: 'Missing required parameters' }, 400);
  }

  try {
    const clipUrl = await downloadAndMergeClip(videoId, start, end, c.env);
    return c.json({ clipUrl });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

function extractVideoId(url) {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const bilibiliRegex = /bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/;
  
  let match = url.match(youtubeRegex);
  if (match) return match[1];
  
  match = url.match(bilibiliRegex);
  if (match) return match[1];
  
  return null;
}

async function getVideoDetails(videoId, apiKey) {
  const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`);
  const data = await response.json();

  if (data.items && data.items.length > 0) {
    const item = data.items[0];
    return {
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      duration: item.contentDetails.duration,
      channelTitle: item.snippet.channelTitle
    };
  } else {
    throw new Error('Video not found');
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
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function parseClipSuggestions(analysis) {
  // This is a simplified parser. You might need to adjust it based on the actual output format from Gemini.
  const suggestions = analysis.split('\n\n');
  return suggestions.map(suggestion => {
    const lines = suggestion.split('\n');
    return {
      title: lines[0].replace(/^\d+\.\s*/, ''),
      timestamps: lines[1].match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/).slice(1).map(Number),
      explanation: lines[2]
    };
  });
}

async function downloadAndMergeClip(videoId, start, end, env) {
  // This is a placeholder function. You'll need to implement the actual video downloading and merging logic.
  // For now, we'll just return a mock URL.
  const mockClipUrl = `https://example.com/clips/${videoId}_${start}_${end}.mp4`;
  
  // In a real implementation, you would:
  // 1. Download the video segment from YouTube
  // 2. Process and merge the clip
  // 3. Store the clip temporarily (e.g., using Cloudflare R2 or KV)
  // 4. Return the URL to the stored clip

  return mockClipUrl;
}

export default {
  fetch: app.fetch
};
