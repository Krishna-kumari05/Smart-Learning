// youtubeService.js
//
// Requires a YouTube Data API v3 key: https://console.cloud.google.com/apis/credentials
// (enable "YouTube Data API v3" on the project first). Put it in backend/.env as
// YOUTUBE_API_KEY=xxxxx

async function searchVideosForTopic(topic, maxResults = 6) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set in backend/.env");
  }

  const query = encodeURIComponent(`${topic} explained tutorial`);
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&order=relevance&maxResults=${maxResults}&q=${query}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "YouTube API request failed");
  }

  return (data.items || []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    channelTitle: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }));
}

module.exports = { searchVideosForTopic };
