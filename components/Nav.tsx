"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <nav className="av-nav">
      <div className="nav-container">
        <Link href="/auth" className="nav-link">
          AUTH
        </Link>
        <Link href="/biblioteca" className="nav-link">
          BIBLIOTECA
        </Link>
        <Link href="/salon" className="nav-link">
          SALÓN
        </Link>
        <Link href="/detalle" className="nav-link">
          DETALLE
        </Link>
        <Link href="/reproductor" className="nav-link">
          REPRODUCTOR
        </Link>
      </div>
    </nav>
  );
}
