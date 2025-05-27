import React, { useState } from "react";
import OpenAI from "openai";
import "./ChatApp.css";

function ChatApp() {
  const [mood, setMood] = useState("");
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSearch = async () => {
    if (!mood.trim()) return;
    setError("");
    setMovie(null);

    try {
      // 1. GPT에게 한국 영화 추천 요청
      const gptRes = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `기분이 "${mood}"일 때 한국 영화 중에서 추천해줄만한 작품 하나만 제목만 알려줘.`,
          },
        ],
        max_tokens: 20,
        temperature: 0.8,
      });

      const movieTitle = gptRes.choices[0].message.content.trim();
      console.log("🎬 GPT 추천 영화:", movieTitle);

      // 2. TMDB에 영화 제목으로 검색
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          movieTitle
        )}&region=KR`
      );
      const tmdbData = await tmdbRes.json();
      const result = tmdbData.results?.[0];

      if (!result) {
        setError("TMDB에서 해당 영화를 찾을 수 없습니다.");
        return;
      }

      setMovie({
        title: result.title,
        overview: result.overview,
        poster: `https://image.tmdb.org/t/p/w500${result.poster_path}`,
        release: result.release_date,
        rating: result.vote_average,
      });
    } catch (err) {
      console.error("에러:", err);
      setError("추천 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="chat-container">
      <h2>🎥 GPT 기반 영화 추천</h2>
      <input
        type="text"
        placeholder="지금 기분을 입력하세요"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />
      <button onClick={handleSearch}>영화 추천받기</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {movie && (
        <div className="movie-box" style={{ marginTop: "20px" }}>
          <img src={movie.poster} alt="poster" width="200" />
          <h3>{movie.title}</h3>
          <p>{movie.overview}</p>
          <p>
            <strong>개봉일:</strong> {movie.release} | ⭐ 평점: {movie.rating}
          </p>
        </div>
      )}
    </div>
  );
}

export default ChatApp;
