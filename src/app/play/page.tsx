"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";

type Drop = { id: number; lane: number; row: number; kind: "star" | "comet" | "moon" };
const LANES = 3;
const ROWS = 6;

export default function PlayPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [ended, setEnded] = useState(false);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("Ready when you are.");
  const laneRef = useRef(1);
  const dropsRef = useRef<Drop[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const runningRef = useRef(false);
  const idRef = useRef(0);
  const tickRef = useRef(0);

  const move = useCallback((direction: number) => {
    laneRef.current = Math.max(0, Math.min(LANES - 1, laneRef.current + direction));
    setLane(laneRef.current);
  }, []);

  const start = useCallback(() => {
    laneRef.current = 1; dropsRef.current = []; scoreRef.current = 0; livesRef.current = 3; idRef.current = 0; tickRef.current = 0;
    setLane(1); setDrops([]); setScore(0); setLives(3); setLevel(1); setEnded(false); setMessage("Collect the starlight. Dodge the comets.");
    runningRef.current = true; setRunning(true);
  }, []);

  useEffect(() => {
    try { setBest(Number(window.localStorage.getItem("lifemode-orbit-best") || 0)); } catch {}
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); move(-1); }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); move(1); }
      if ((event.key === " " || event.key === "Enter") && !runningRef.current) { event.preventDefault(); start(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, start]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!runningRef.current) return;
      tickRef.current += 1;
      const next: Drop[] = dropsRef.current.map(drop => ({ ...drop, row: drop.row + 1 })).filter(drop => drop.row < ROWS);
      const arriving = next.filter(drop => drop.row === ROWS - 1 && drop.lane === laneRef.current);
      let gain = 0;
      let lost = 0;
      for (const item of arriving) {
        if (item.kind === "star") gain += 1;
        else if (item.kind === "moon") gain += 3;
        else lost += 1;
      }
      const kept = next.filter(drop => !arriving.some(item => item.id === drop.id));
      if (tickRef.current % Math.max(2, 5 - Math.floor(scoreRef.current / 8)) === 0) {
        const roll = Math.random();
        kept.push({ id: idRef.current++, lane: Math.floor(Math.random() * LANES), row: 0, kind: roll > .89 ? "moon" : roll > .61 ? "comet" : "star" });
      }
      dropsRef.current = kept;
      if (gain) { scoreRef.current += gain; setScore(scoreRef.current); setLevel(1 + Math.floor(scoreRef.current / 8)); setMessage(gain > 1 ? "Moon fragment! A little bonus." : "Starlight collected!"); }
      if (lost) {
        livesRef.current = Math.max(0, livesRef.current - lost); setLives(livesRef.current); setMessage(livesRef.current ? "Comet collision — keep moving!" : "The comets got you. One more flight?");
      }
      setDrops([...kept]);
      if (livesRef.current <= 0) {
        runningRef.current = false; setRunning(false); setEnded(true);
        const finalScore = scoreRef.current;
        setBest(previous => {
          const nextBest = Math.max(previous, finalScore);
          try { window.localStorage.setItem("lifemode-orbit-best", String(nextBest)); } catch {}
          return nextBest;
        });
      }
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="lm-game min-h-screen pb-28 text-[#f7f1e8] lg:pb-8">
    <header className="lm-story-nav"><Link href="/discover" className="lm-story-brand"><span>L</span> LIFEMODE.</Link><Link href="/stories" className="lm-story-nav-link">Story room ↗</Link></header>
    <section className="lm-game-hero lm-orbit-hero"><p className="lm-story-eyebrow"><i/> THE LITTLE ARCADE · A TINY COSMIC ADVENTURE</p><div className="lm-game-orb" aria-hidden="true"><span>✦</span><i/><i/></div><h1>Orbit<br/><em>Dash.</em></h1><p>You're a tiny explorer crossing a sky full of comets. Slide between three lanes, collect glowing stars and rare moons, and don't let the comets catch you.</p>
      <div className="lm-game-stats"><div><span>{score}</span><small>STARDUST</small></div><div><span>{lives === 0 ? "—" : "♥ ".repeat(lives).trim()}</span><small>SHIELDS</small></div><div><span>{best}</span><small>PERSONAL BEST</small></div></div>
    </section>
    <section className="lm-game-board-wrap lm-orbit-wrap">
      <div className="lm-game-board-head"><div><span>FLIGHT {String(level).padStart(2,"0")} · {running ? "IN MOTION" : ended ? "FLIGHT COMPLETE" : "LAUNCH PAD"}</span><h2>{ended ? "The galaxy awaits a rematch." : running ? "Keep your eyes on the sky." : "Ready to chase the stars?"}</h2></div>{running ? <button onClick={() => {runningRef.current=false;setRunning(false);setMessage("Flight paused. Take your time.");}}>Pause Ⅱ</button> : <button onClick={start}>{ended ? "Fly again ↻" : "Launch ✦"}</button>}</div>
      <div className={"lm-orbit-scene" + (running ? " is-running" : "")} role="group" aria-label="Orbit Dash game field">
        <div className="lm-orbit-nebula"/><div className="lm-orbit-lanes">{Array.from({length:LANES},(_,i)=><div key={i} className={"lm-orbit-lane" + (lane===i?" active-lane":"")}/>)}</div>
        {drops.map(drop=><div key={drop.id} className={"lm-orbit-drop " + drop.kind} style={{left:(drop.lane*33.333+16.666)+"%",top:((drop.row+.5)/ROWS*100)+"%"}} aria-label={drop.kind}>{drop.kind==="star"?"✦":drop.kind==="moon"?"☾":"☄"}</div>)}
        <div className="lm-orbit-player" style={{left:(lane*33.333+16.666)+"%"}}><span>✧</span><i/></div>
        {!running && <div className="lm-orbit-overlay">{ended ? <><span>✦ FLIGHT LOG</span><strong>{score} stardust</strong><p>Every flight teaches you the rhythm of the sky.</p></> : <><span>YOUR SHIP IS WAITING</span><strong>Ready, explorer?</strong><p>Use the arrows or tap a lane below to steer.</p></>}</div>}
      </div>
      <div className="lm-orbit-controls" aria-label="Steering controls"><button onClick={()=>move(-1)} aria-label="Steer left">←</button><div><span>{message}</span><small>← / → OR A / D</small></div><button onClick={()=>move(1)} aria-label="Steer right">→</button></div>
      <div className="lm-orbit-legend"><span><b>✦</b> Star +1</span><span><b>☾</b> Moon +3</span><span><b>☄</b> Comet −1 shield</span></div>
      {ended && <div className="lm-game-win" role="status"><span>✦</span><h3>Flight complete.</h3><p>You collected {score} stardust. Your best flight is {Math.max(best,score)}. Ready for another little adventure?</p><button onClick={start}>Launch again ↗</button></div>}
    </section>
    <footer className="lm-story-bottom"><span>✧</span><p>A tiny adventure, whenever you need a break.</p><Link href="/stories">Read a story ↗</Link></footer>
    <MobileNav/>
  </main>;
}
