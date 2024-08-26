const express = require('express');
const fetch = require('node-fetch');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.get('/api/analyze', async (req, res) => {
    console.log('Received request for video analysis');
    const videoUrl = req.query.url;

    if (!videoUrl) {
        console.error('No video URL provided');
        return res.status(400).json({ error: 'No video URL provided' });
    }

    try {
        const videoId = extractVideoId(videoUrl);
        console.log(`Extracted video ID: ${videoId}`);

        const videoDetails = await getVideoDetails(videoId);
        console.log('Retrieved video details:', videoDetails);

        const clipSuggestions = await generateClipSuggestions(videoDetails);
        console.log('Generated clip suggestions:', clipSuggestions);

        res.json({ videoDetails, clipSuggestions });
    } catch (error) {
        console.error('Error during video analysis:', error);
        res.status(500).json({ error: error.message });
    }
});

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

async function getVideoDetails(videoId) {
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    const data = await response.json();

    if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
            id: videoId,
            title: video.snippet.title,
            channelTitle: video.snippet.channelTitle,
            duration: video.contentDetails.duration,
            thumbnailUrl: video.snippet.thumbnails.medium.url,
        };
    } else {
        throw new Error('Video not found');
    }
}

async function generateClipSuggestions(videoDetails) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const prompt = `Given the following YouTube video details, suggest 3 interesting clips that could be extracted from the video. Each clip should have a title, start and end timestamps, and a brief explanation of why it's interesting.

Video Title: ${videoDetails.title}
Channel: ${videoDetails.channelTitle}
Duration: ${videoDetails.duration}

Please format your response as a JSON array of objects, where each object represents a clip suggestion and has the following properties:
- title: A catchy title for the clip
- timestamps: An array with two elements, the start and end times in seconds
- explanation: A brief explanation of why this clip is interesting

Example format:
[
  {
    "title": "Exciting Moment",
    "timestamps": [30, 60],
    "explanation": "This clip captures a key turning point in the video."
  }
]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return JSON.parse(text);
}

app.get('/api/download-clip', (req, res) => {
    // Placeholder for clip download functionality
    res.json({ clipUrl: 'https://example.com/clip.mp4' });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
