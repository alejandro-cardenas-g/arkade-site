"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href !== "/" && pathname.startsWith(href)) return true;
    return false;
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    setMobileOpen(false);
  };

  return (
    <>
      <nav className="av-nav">
        <div className="logo" onClick={() => handleNavigate("/")}>
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>
        <div className="links">
          <Link href="/" className={isActive("/") ? "active" : ""}>
            Inicio
          </Link>
          <Link
            href="/biblioteca"
            className={isActive("/biblioteca") ? "active" : ""}
          >
            Biblioteca
          </Link>
          <Link href="/salon" className={isActive("/salon") ? "active" : ""}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        <button
          className="btn auth-btn"
          onClick={() => handleNavigate("/auth")}
        >
          Iniciar Sesión
        </button>
        <button
          className="btn ghost hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop${mobileOpen ? " open" : ""}`}
        onClick={() => setMobileOpen(false)}
      ></div>
      <aside className={`av-mobile-panel${mobileOpen ? " open" : ""}`}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <button onClick={() => handleNavigate("/")} className={isActive("/") ? "active" : ""}>
          Inicio
        </button>
        <button
          onClick={() => handleNavigate("/biblioteca")}
          className={isActive("/biblioteca") ? "active" : ""}
        >
          Biblioteca
        </button>
        <button
          onClick={() => handleNavigate("/salon")}
          className={isActive("/salon") ? "active" : ""}
        >
          Salón de la Fama
        </button>
        <button
          onClick={() => handleNavigate("/auth")}
          className={isActive("/auth") ? "active" : ""}
        >
          Iniciar Sesión
        </button>
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
