import React, { useState } from 'react';
import './App.css';

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoDetails, setVideoDetails] = useState(null);
  const [clipSuggestions, setClipSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [selectedClip, setSelectedClip] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setVideoDetails(null);
    setClipSuggestions([]);

    try {
      const response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch video details');
      }
      const data = await response.json();
      setVideoDetails(data.videoDetails);
      setClipSuggestions(data.clipSuggestions);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClipSelect = (clip) => {
    setSelectedClip(clip);
  };

  const handleClipDownload = async () => {
    if (!selectedClip) return;

    try {
      const response = await fetch(`/api/download-clip?videoId=${videoDetails.id}&start=${selectedClip.timestamps[0]}&end=${selectedClip.timestamps[1]}`);
      if (!response.ok) {
        throw new Error('Failed to download clip');
      }
      const data = await response.json();
      window.open(data.clipUrl, '_blank');
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>InkyClip</h1>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube/Bilibili video URL"
            className="url-input"
          />
          <button type="submit" className="submit-button" disabled={loading}>
            Analyze Video
          </button>
        </form>
      </header>
      <main>
        {loading && <div className="loader">Analyzing video...</div>}
        {error && <p className="error">{error}</p>}
        {videoDetails && (
          <div className="video-details">
            <img src={videoDetails.thumbnailUrl} alt={videoDetails.title} />
            <h2>{videoDetails.title}</h2>
            <p>Duration: {videoDetails.duration}</p>
            <p>Channel: {videoDetails.channelTitle}</p>
          </div>
        )}
        {clipSuggestions.length > 0 && (
          <div className="clip-suggestions">
            <h3>Suggested Viral Clips:</h3>
            <ul>
              {clipSuggestions.map((clip, index) => (
                <li key={index} onClick={() => handleClipSelect(clip)} className={selectedClip === clip ? 'selected' : ''}>
                  <h4>{clip.title}</h4>
                  <p>Time: {formatTimestamp(clip.timestamps[0])} - {formatTimestamp(clip.timestamps[1])}</p>
                  <p>{clip.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {selectedClip && (
          <div className="clip-preview">
            <h3>Selected Clip Preview</h3>
            <video controls>
              <source src={`https://www.youtube.com/embed/${videoDetails.id}?start=${selectedClip.timestamps[0]}&end=${selectedClip.timestamps[1]}`} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <button onClick={handleClipDownload} className="download-button">Download Clip</button>
          </div>
        )}
      </main>
    </div>
  );
}

function formatTimestamp(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default App;
