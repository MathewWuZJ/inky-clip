import './index.css';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const resultsContainer = document.getElementById('results');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('video-url').value;

    try {
      const response = await fetch(`/api/analyze?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (response.ok) {
        displayResults(data);
      } else {
        throw new Error(data.error || 'An error occurred');
      }
    } catch (error) {
      resultsContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
  });

  function displayResults(data) {
    const { videoDetails, clipSuggestions } = data;
    let html = `
      <h2>${videoDetails.title}</h2>
      <p>Channel: ${videoDetails.channelTitle}</p>
      <p>Duration: ${videoDetails.duration}</p>
      <img src="${videoDetails.thumbnailUrl}" alt="Video Thumbnail">
      <h3>Suggested Clips:</h3>
    `;

    clipSuggestions.forEach((clip, index) => {
      html += `
        <div class="clip">
          <h4>${index + 1}. ${clip.title}</h4>
          <p>Timestamps: ${formatTimestamp(clip.timestamps[0])} - ${formatTimestamp(clip.timestamps[1])}</p>
          <p>${clip.explanation}</p>
        </div>
      `;
    });

    resultsContainer.innerHTML = html;
  }

  function formatTimestamp(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
});
