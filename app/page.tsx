export default function Home() {
  return (
    <div id="root" className="av-main">
      <nav className="av-nav">
        <div className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text">ARCADE VAULT</div>
        </div>
        <div className="links">
          <a href="#" className="active">
            LIBRARY
          </a>
          <a href="#">TOURNAMENTS</a>
          <a href="#">LEADERBOARD</a>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <div className="coin"></div>
          <span>12,500</span>
        </div>
        <button className="btn magenta">SIGN IN</button>
      </nav>

      <section className="av-hero">
        <h1 className="neon-cyan">ARCADE VAULT</h1>
        <div className="sub">
          Competitive Gaming Platform <span className="blink">▮</span>
        </div>
      </section>

      <section className="av-filters">
        <div className="av-search">
          <span className="ico">🔍</span>
          <input type="text" placeholder="Search games..." />
        </div>
        <div className="av-chips">
          <button className="chip active">ALL</button>
          <button className="chip">ACTION</button>
          <button className="chip">PUZZLE</button>
          <button className="chip">STRATEGY</button>
        </div>
      </section>

      <section className="av-grid">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card">
            <div className={`cover cover-${["bricks", "tetro", "snake", "glot", "invaders", "rocas"][i]}`}>
              <span className="label">CLASSIC</span>
            </div>
            <div className="meta">
              <div className="title">Game Title {i + 1}</div>
              <div className="desc">
                Compete with players worldwide in this iconic arcade experience.
              </div>
            </div>
            <div className="row">
              <div className="score-badge">
                <span>SCORE</span>
                <b>9,850</b>
              </div>
              <button className="btn lg">PLAY</button>
            </div>
          </div>
        ))}
      </section>

      <section className="av-hall">
        <div className="hall-head">
          <h1>GLOBAL LEADERBOARD</h1>
          <p>Top players compete for glory</p>
        </div>

        <div className="podium">
          <div className="podium-slot silver">
            <div className="rank-num">2</div>
            <div className="name">PLAYER TWO</div>
            <div className="score">98,450</div>
            <div className="date">TODAY</div>
          </div>
          <div className="podium-slot gold">
            <div className="rank-num">1</div>
            <div className="name">CHAMPION</div>
            <div className="score">125,680</div>
            <div className="date">TODAY</div>
          </div>
          <div className="podium-slot bronze">
            <div className="rank-num">3</div>
            <div className="name">PLAYER THREE</div>
            <div className="score">87,220</div>
            <div className="date">TODAY</div>
          </div>
        </div>

        <div className="hall-table">
          <div className="th">
            <div>RANK</div>
            <div>PLAYER</div>
            <div>GAME</div>
            <div>SCORE</div>
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={`tr ${i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""}`}>
              <div className="rk">#{i + 1}</div>
              <div className="pl">PLAYER_{String(i + 1).padStart(3, "0")}</div>
              <div className="pl">Arcade Game</div>
              <div className="sc">{100000 - i * 5000}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
