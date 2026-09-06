"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GAMES, CATS } from "@/lib/mockData";
import { getAllGames } from "@/lib/games/catalog";

interface GameCardProps {
  game: (typeof GAMES)[0];
  onSelect: (game: (typeof GAMES)[0]) => void;
}

function GameCard({ game, onSelect }: GameCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  return (
    <div
      ref={tiltRef}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => onSelect(game)}
    >
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <button
            className={
              "btn " +
              (game.color === "magenta"
                ? "magenta"
                : game.color === "yellow"
                  ? "yellow"
                  : "")
            }
            onClick={(e) => {
              e.stopPropagation();
              onSelect(game);
            }}
          >
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
}

interface CatalogGameCardProps {
  id: string;
  name: string;
  description: string;
  route: string;
}

function CatalogGameCard({
  id,
  name,
  description,
  route,
}: CatalogGameCardProps) {
  const tiltRef = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };

  const onLeave = () => {
    const el = tiltRef.current;
    if (!el) return;
    el.style.transform = "";
  };

  return (
    <div
      ref={tiltRef}
      className="card"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="cover">
        <div className="cover-bg" style={{ backgroundColor: "#1a1a2e" }}></div>
        <div className="label">PLAYABLE</div>
      </div>
      <div className="meta">
        <div className="title">{name}</div>
        <div className="desc">{description}</div>
        <div className="row">
          <Link
            href={route}
            className="btn"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BibliotecaPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("TODOS");

  const filtered = useMemo(() => {
    return GAMES.filter(
      (g) =>
        (cat === "TODOS" || g.cat === cat) &&
        g.title.toLowerCase().includes(q.toLowerCase()),
    );
  }, [q, cat]);

  const catalogGames = getAllGames();

  return (
    <div className="fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      {/* Catalog Games Section */}
      {catalogGames.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              padding: "20px 40px",
              borderBottom: "2px solid var(--magenta)",
              marginBottom: 20,
            }}
          >
            <h2
              className="pixel"
              style={{ color: "var(--magenta)", fontSize: 18 }}
            >
              JUEGOS DISPONIBLES
            </h2>
          </div>
          <div className="av-grid">
            {catalogGames.map((game) => (
              <CatalogGameCard
                key={game.id}
                id={game.id}
                name={game.name}
                description={game.description}
                route={game.route}
              />
            ))}
          </div>
        </div>
      )}

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar un juego por nombre…"
          />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
            <button
              key={c}
              className={"chip" + (cat === c ? " active" : "")}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            onSelect={(game) => router.push(`/detalle?id=${game.id}`)}
          />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 80,
              color: "var(--ink-faint)",
            }}
          >
            <div
              className="pixel"
              style={{
                fontSize: 14,
                color: "var(--magenta)",
                marginBottom: 12,
              }}
            >
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </div>
  );
}
