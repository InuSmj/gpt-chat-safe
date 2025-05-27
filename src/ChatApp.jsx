import React, { useState } from "react";
import OpenAI from "openai";
import "./ChatApp.css";

function ChatApp() {
  const [mood, setMood] = useState("");
  const [keyword, setKeyword] = useState("");
  const [movie, setMovie] = useState(null);

  const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

  const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleAnalyzeMood = async () => {
    if (!mood.trim()) return;

    try {
      const res = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: `기분이 "${mood}"인 사람에게 어울리는 영화 키워드를 하나만 영어로 추천해줘. 예: comfort, excitement 등`,
          },
        ],
        max_tokens: 10,
        temperature: 0.7,
      });

      const keyword = res.choices[0].message.content.trim();
      setKeyword(keyword);

      // TMDB 검색
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${keyword}&region=KR`
      );
      const searchData = await searchRes.json();
      const movieId = searchData.results?.[0]?.id;

      if (movieId) {
        const detailRes = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&append_to_response=credits`
        );
        const detailData = await detailRes.json();

        const castNames = detailData.credits.cast
          .slice(0, 3)
          .map((c) => c.name)
          .join(", ");
        const genreNames = detailData.genres.map((g) => g.name).join(", ");

        setMovie({
          title: detailData.title,
          poster: `https://image.tmdb.org/t/p/w500${detailData.poster_path}`,
          genres: genreNames,
          cast: castNames,
          rating: detailData.vote_average,
        });
      } else {
        setMovie(null);
      }
    } catch (err) {
      console.error("에러 발생:", err);
      setKeyword("오류 발생");
      setMovie(null);
    }
  };

  return (
    <div className="chat-container">
      <h2>기분 기반 영화 추천</h2>
      <input
        type="text"
        placeholder="기분을 입력하세요"
        value={mood}
        onChange={(e) => setMood(e.target.value)}
      />
      <button onClick={handleAnalyzeMood}>GPT + TMDB 추천</button>

      {keyword && (
        <div className="message-content" style={{ marginTop: "20px" }}>
          🎯 GPT 키워드: <strong>{keyword}</strong>
        </div>
      )}

      {movie && (
        <div className="message-content movie-box">
          <h3>🎬 {movie.title}</h3>
          <img src={movie.poster} alt="poster" width="200" />
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
      )}
    </div>
  );
}

export default ChatApp;
