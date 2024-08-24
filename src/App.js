import React, { useState } from 'react';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState(null);
  const [viralSegments, setViralSegments] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      setVideoInfo(data.video_info);
      setViralSegments(data.viral_segments);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">InkyClip</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl">
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter or paste YouTube/Bilibili video URL or channel name here"
            className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="absolute right-0 top-0 h-full px-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-r-lg text-white font-semibold flex items-center"
          >
            Get Clips
          </button>
        </div>
      </form>
      {loading && (
        <div className="mt-8">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      {videoInfo && (
        <div className="mt-8 bg-white bg-opacity-10 rounded-lg p-6 w-full max-w-2xl">
          <img src={videoInfo.thumbnail} alt="Video thumbnail" className="w-full rounded-lg mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{videoInfo.title}</h2>
          <div className="flex justify-between text-gray-300">
            <span>Duration: {videoInfo.duration}</span>
            <span>Views: {videoInfo.view_count}</span>
          </div>
        </div>
      )}
      {viralSegments.length > 0 && (
        <div className="mt-8 bg-white bg-opacity-10 rounded-lg p-6 w-full max-w-2xl">
          <h3 className="text-lg font-bold text-white mb-4">Potential Viral Clips</h3>
          {viralSegments.map((segment, index) => (
            <div key={index} className="mb-4 p-4 bg-purple-800 bg-opacity-50 rounded-lg">
              <h4 className="text-white font-semibold">Segment {index + 1}</h4>
              <p className="text-gray-300">Viral Potential: {segment.analysis.viral_potential.toFixed(2)}</p>
              <p className="text-gray-300">Summary: {segment.analysis.summary}</p>
              <div className="mt-2">
                {segment.analysis.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="inline-block bg-purple-600 text-white rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
