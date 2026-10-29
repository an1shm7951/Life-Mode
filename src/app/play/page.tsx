"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";

const symbols = ["✦", "☾", "✿", "☼", "✧", "❋"];
type Card = { id: number; symbol: string };
function makeDeck(): Card[] {
  return [...symbols, ...symbols].map((symbol, index) => ({ id: index, symbol })).sort(() => Math.random() - 0.5);
}

export default function PlayPage() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);

  const reset = useCallback(() => {
    setDeck(makeDeck()); setOpen([]); setMatched([]); setMoves(0); setLocked(false); setStarted(true);
  }, []);
  useEffect(() => { reset(); }, [reset]);

  function flip(card: Card) {
    if (locked || matched.includes(card.id) || open.includes(card.id)) return;
    if (!started) setStarted(true);
    if (open.length === 0) { setOpen([card.id]); return; }
    const first = deck.find(item => item.id === open[0]);
    setMoves(value => value + 1);
    if (first?.symbol === card.symbol) {
      setMatched(value => [...value, first.id, card.id]);
      setOpen([]);
    } else {
      setOpen([open[0], card.id]);
      setLocked(true);
      window.setTimeout(() => { setOpen([]); setLocked(false); }, 720);
    }
  }

  const won = matched.length === deck.length && deck.length > 0;
  return <main className="lm-game min-h-screen pb-28 text-[#f7f1e8] lg:pb-8">
    <header className="lm-story-nav"><Link href="/discover" className="lm-story-brand"><span>L</span> LIFEMODE.</Link><Link href="/stories" className="lm-story-nav-link">Story room ↗</Link></header>
    <section className="lm-game-hero"><p className="lm-story-eyebrow"><i/> THE LITTLE ARCADE · NO PRESSURE, JUST PLAY</p><div className="lm-game-orb" aria-hidden="true"><span>✦</span><i/><i/></div><h1>Starlight<br/><em>Pairs.</em></h1><p>Find the matching symbols. Flip two cards at a time, remember what you saw, and bring the little constellation together.</p><div className="lm-game-stats"><div><span>{moves}</span><small>MOVES</small></div><div><span>{matched.length / 2} / {symbols.length}</span><small>PAIRS FOUND</small></div><div><span>{won ? "✦" : "∞"}</span><small>{won ? "CONSTELLATION COMPLETE" : "TAKE YOUR TIME"}</small></div></div></section>
    <section className="lm-game-board-wrap"><div className="lm-game-board-head"><div><span>01 / MEMORY GARDEN</span><h2>{won ? "You found every star." : "Find the pairs."}</h2></div><button onClick={reset}>Start fresh ↻</button></div>
      <div className="lm-game-board" role="group" aria-label="Starlight Pairs memory game">{deck.map(card => { const visible = open.includes(card.id) || matched.includes(card.id); return <button key={card.id} className={"lm-game-card" + (visible ? " is-visible" : "") + (matched.includes(card.id) ? " is-matched" : "")} onClick={() => flip(card)} aria-label={visible ? (card.symbol + (matched.includes(card.id) ? ", matched" : "")) : "Reveal hidden symbol"} aria-pressed={visible}><span className="lm-game-card-back">✧</span><span className="lm-game-card-front">{card.symbol}</span></button>; })}</div>
      {won ? <div className="lm-game-win" role="status"><span>✦</span><h3>Constellation complete.</h3><p>You found all the pairs in {moves} moves. There is always room for one more round.</p><button onClick={reset}>Play again ↗</button></div> : <p className="lm-game-hint">A match stays lit. A mismatch fades back into the night. Nothing is timed, and your best score is not the point.</p>}
    </section>
    <footer className="lm-story-bottom"><span>✧</span><p>A tiny pause can be part of a good day.</p><Link href="/stories">Read a story ↗</Link></footer>
    <MobileNav/>
  </main>;
}
