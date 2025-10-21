const axios = require('axios');

const YOUTUBE_API_KEY = 'AIzaSyANBsgifW1EASk2z0xi6A0oI4RIUsRFujo';

const RequestSong = async (req, res) => {
  const query = req.query.q;
  const chat = req.query.chat === "true"; // تحويل القيمة إلى Boolean

  if (!query) {
    return res.status(400).json({ error: "Query parameter q is required" });
  }

  try {
    // البحث عن الفيديوهات
    const searchResponse = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: query,
        type: "video",
        maxResults: chat ? 1 : 5, // إذا chat=true نرجع عنصر واحد
        key: YOUTUBE_API_KEY,
      },
    });

    const items = searchResponse.data.items;
    const videoIds = items.map((item) => item.id.videoId).join(",");

    // جلب تفاصيل الفيديوهات
    const detailsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
      params: {
        part: "contentDetails",
        id: videoIds,
        key: YOUTUBE_API_KEY,
      },
    });

    // تحويل مدة ISO 8601 إلى ثوانٍ
    const detailsMap = {};
    for (const video of detailsResponse.data.items) {
      const duration = video.contentDetails?.duration || "PT0S";
      detailsMap[video.id] = parseYouTubeDuration(duration);
    }

    // دمج النتائج
    const results = items.map((item) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      duration: detailsMap[item.id.videoId] || 0,
      description: item.snippet.description,
      thumbnails: item.snippet.thumbnails,
    }));
    
    if (chat) {
      res.json(results[0]); // ترجع عنصر واحد فقط
    } else {
      res.json(results); // ترجع مصفوفة من 5 عناصر
    }
  } catch (error) {
    console.error("YouTube API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Something went wrong fetching from YouTube API" });
  }
};


// 🔢 تحويل صيغة المدة من ISO (PT4M20S) إلى ثوانٍ
function parseYouTubeDuration(isoDuration) {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  const hours = parseInt(match?.[1] || 0);
  const minutes = parseInt(match?.[2] || 0);
  const seconds = parseInt(match?.[3] || 0);
  return hours * 3600 + minutes * 60 + seconds;
}
const getVideoIdFromUrl = (url) => {
  const match = url.match(
    /(?:v=|\/)([0-9A-Za-z_-]{11})(?:[&?]|$)/
  );
  return match ? match[1] : null;
};
const getInfoVideo = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const videoId = getVideoIdFromUrl(url); // ✅ استخراج videoId
    if (!videoId) return res.status(400).json({ error: "Invalid YouTube URL" });

    const response = await axios.get(url);
    const html = response.data;

    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    let title = titleMatch?.[1]?.replace(" - YouTube", "").trim() || "Unknown Title";

    const jsonMatch = html.match(/var ytInitialPlayerResponse\s*=\s*(\{.*?\});<\/script>/);
    let channel = "Unknown Channel";
    let duration = 0;

    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        channel = data.videoDetails?.author || "Unknown Channel";
        duration = parseInt(data.videoDetails?.lengthSeconds) || 0;
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    }
    res.json({ title, channel, duration, videoId,  thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` ,url});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch video info" });
  }
};

module.exports = { RequestSong ,getInfoVideo};
