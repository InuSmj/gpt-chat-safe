import React, { useState } from "react";
import OpenAI from "openai";
import "./ChatApp.css";

function ChatApp() {
  const [mood, setMood] = useState("");
  const [keyword, setKeyword] = useState("");
  const [movies, setMovies] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [error, setError] = useState("");

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleAnalyzeMood = async () => {
    if (!mood.trim()) return;
    setError("");
    setMovies([]);
    setTracks([]);
    setKeyword("");

    try {
      // GPT 키워드 추출
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `기분이 "${mood}"인 사람에게 어울리는 음악 또는 영화 키워드를 하나만 영어로 추천해줘. 예: jazz, excitement, comforting 등`,
          },
        ],
        max_tokens: 10,
        temperature: 0.7,
      });

      const gptKeyword = res.choices[0].message.content.trim();
      setKeyword(gptKeyword);

      // TMDB 검색 (한국 개봉작 기준)
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          gptKeyword
        )}&region=KR`
      );
      const searchData = await searchRes.json();
      const topMovies = searchData.results.slice(0, 3);

      const detailedMovies = await Promise.all(
        topMovies.map(async (movie) => {
          const detailRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits`
          );
          const detailData = await detailRes.json();

          return {
            title: detailData.title,
            poster: `https://image.tmdb.org/t/p/w500${detailData.poster_path}`,
            genres: detailData.genres.map((g) => g.name).join(", "),
            cast: detailData.credits.cast
              .slice(0, 3)
              .map((c) => c.name)
              .join(", "),
            rating: detailData.vote_average,
          };
        })
      );
      setMovies(detailedMovies);

      // Deezer 음악 검색
      const deezerRes = await fetch(
        `https://api.deezer.com/search?q=${encodeURIComponent(gptKeyword)}`
      );
      const deezerData = await deezerRes.json();
      setTracks(deezerData.data.slice(0, 3));
    } catch (err) {
      console.error("에러 발생:", err);
      setError("추천을 불러오는 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="chat-container">
      <h2>기분 기반 영화 + 음악 추천</h2>
      <input
        type="text"
        placeholder="기분을 입력하세요"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />
      <button onClick={handleAnalyzeMood}>추천받기</button>

      {keyword && (
        <div className="message-content" style={{ marginTop: "20px" }}>
          🎯 GPT 키워드: <strong>{keyword}</strong>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {movies.length > 0 && (
        <div className="results-section">
          <h3>🎬 영화 추천</h3>
          {movies.map((movie, i) => (
            <div className="movie-box" key={i}>
              <img src={movie.poster} alt="poster" width="200" />
              <h4>{movie.title}</h4>
              <p>
                <strong>장르:</strong> {movie.genres}
              </p>
              <p>
                <strong>출연:</strong> {movie.cast}
              </p>
              <p>
                <strong>평점:</strong> {movie.rating}
              </p>
            </div>
          ))}
        </div>
      )}

      {tracks.length > 0 && (
        <div className="results-section">
          <h3>🎵 음악 추천</h3>
          {tracks.map((track, i) => (
            <div className="music-box" key={i}>
              <img src={track.album.cover_medium} alt="cover" width="100" />
              <p>
                <strong>{track.title}</strong> - {track.artist.name}
              </p>
              <audio controls src={track.preview}></audio>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatApp;
