"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MobileNav } from "@/components/mobile-nav";

type Drop = { id: number; lane: number; row: number; kind: "star" | "comet" | "moon" | "shield" };
const LANES = 3;
const ROWS = 6;
const MAX_SHIELDS = 3;

export default function PlayPage() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [lane, setLane] = useState(1);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [lives, setLives] = useState(MAX_SHIELDS);
  const [combo, setCombo] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("Ready when you are.");
  const laneRef = useRef(1);
  const dropsRef = useRef<Drop[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(MAX_SHIELDS);
  const comboRef = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const idRef = useRef(0);
  const tickRef = useRef(0);

  const move = useCallback((direction: number) => {
    laneRef.current = Math.max(0, Math.min(LANES - 1, laneRef.current + direction));
    setLane(laneRef.current);
  }, []);

  const launch = useCallback(() => {
    laneRef.current = 1; dropsRef.current = []; scoreRef.current = 0; livesRef.current = MAX_SHIELDS; comboRef.current = 0; idRef.current = 0; tickRef.current = 0;
    setLane(1); setDrops([]); setScore(0); setLives(MAX_SHIELDS); setCombo(0); setLevel(1); setEnded(false); setPaused(false); pausedRef.current = false; setMessage("Collect the stars. Dodge comets. Grab shields.");
    runningRef.current = true; setRunning(true);
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    setMessage(pausedRef.current ? "Flight paused. Catch your breath." : "Back in orbit. Eyes up!");
  }, []);

  useEffect(() => {
    try { setBest(Number(window.localStorage.getItem("lifemode-orbit-best") || 0)); } catch {}
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") { event.preventDefault(); if (runningRef.current && !pausedRef.current) move(-1); }
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") { event.preventDefault(); if (runningRef.current && !pausedRef.current) move(1); }
      if ((event.key === " " || event.key === "Enter") && !runningRef.current) { event.preventDefault(); launch(); }
      if (event.key.toLowerCase() === "p" && runningRef.current) { event.preventDefault(); pause(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, launch, pause]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!runningRef.current || pausedRef.current) return;
      tickRef.current += 1;
      const next: Drop[] = dropsRef.current.map(drop => ({ ...drop, row: drop.row + 1 })).filter(drop => drop.row < ROWS);
      const arriving = next.filter(drop => drop.row === ROWS - 1 && drop.lane === laneRef.current);
      let gain = 0;
      let lost = 0;
      let shieldGain = 0;
      let gotPickup = false;
      let gotComet = false;
      for (const item of arriving) {
        if (item.kind === "star") { gain += 1; gotPickup = true; }
        else if (item.kind === "moon") { gain += 3; gotPickup = true; }
        else if (item.kind === "shield") { shieldGain += 1; gotPickup = true; }
        else { lost += 1; gotComet = true; }
      }
      const kept = next.filter(drop => !arriving.some(item => item.id === drop.id));
      const interval = Math.max(2, 5 - Math.floor(scoreRef.current / 10));
      if (tickRef.current % interval === 0) {
        const roll = Math.random();
        const kind: Drop["kind"] = roll > .94 ? "shield" : roll > .85 ? "moon" : roll > .56 ? "comet" : "star";
        kept.push({ id: idRef.current++, lane: Math.floor(Math.random() * LANES), row: 0, kind });
      }
      if (gotPickup) {
        comboRef.current += 1;
        const comboBonus = comboRef.current > 0 && comboRef.current % 5 === 0 ? 4 : 0;
        const totalGain = gain + comboBonus;
        scoreRef.current += totalGain;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        setLevel(1 + Math.floor(scoreRef.current / 10));
        setMessage(comboBonus ? "✨ Five in a row! Combo bonus +4!" : shieldGain ? (livesRef.current < MAX_SHIELDS ? "Shield restored. Nice catch!" : "Shield energy collected — already fully protected!") : gain > 1 ? "Moon fragment! +3 stardust." : "Starlight collected!");
      }
      if (shieldGain) livesRef.current = Math.min(MAX_SHIELDS, livesRef.current + shieldGain);
      if (gotComet) { comboRef.current = 0; setCombo(0); livesRef.current = Math.max(0, livesRef.current - lost); setMessage(livesRef.current ? "Comet collision — switch lanes!" : "Your shields are down. One more flight?"); }
      if (shieldGain || gotComet) setLives(livesRef.current);
      dropsRef.current = kept;
      setDrops([...kept]);
      if (livesRef.current <= 0) {
        runningRef.current = false; setRunning(false); setPaused(false); pausedRef.current = false; setEnded(true);
        const finalScore = scoreRef.current;
        setBest(previous => {
          const nextBest = Math.max(previous, finalScore);
          try { window.localStorage.setItem("lifemode-orbit-best", String(nextBest)); } catch {}
          return nextBest;
        });
      }
    }, 400);
    return () => window.clearInterval(timer);
  }, []);

  return <main className="lm-game min-h-screen pb-28 text-[#f7f1e8] lg:pb-8">
    <header className="lm-story-nav"><Link href="/discover" className="lm-story-brand"><span>L</span> LIFEMODE.</Link><Link href="/stories" className="lm-story-nav-link">Story room ↗</Link></header>
    <section className="lm-game-hero lm-orbit-hero"><p className="lm-story-eyebrow"><i/> THE LITTLE ARCADE · A TINY COSMIC ADVENTURE</p><div className="lm-game-orb" aria-hidden="true"><span>✦</span><i/><i/></div><h1>Orbit<br/><em>Dash.</em></h1><p>You're a tiny explorer crossing a sky full of comets. Dodge danger, collect stardust, grab rare moon fragments, and build a streak before the galaxy speeds up.</p>
      <div className="lm-game-stats"><div><span>{score}</span><small>STARDUST</small></div><div><span>{"♥ ".repeat(lives).trim() || "—"}</span><small>SHIELDS</small></div><div><span>{best}</span><small>PERSONAL BEST</small></div></div>
    </section>
    <section className="lm-game-board-wrap lm-orbit-wrap">
      <div className="lm-game-board-head"><div><span>FLIGHT {String(level).padStart(2,"0")} · {running ? paused ? "PAUSED" : "IN MOTION" : ended ? "FLIGHT COMPLETE" : "LAUNCH PAD"}</span><h2>{ended ? "The galaxy awaits a rematch." : paused ? "Take a breath, explorer." : running ? "Keep your eyes on the sky." : "Ready to chase the stars?"}</h2></div>{running ? <button onClick={pause}>{paused ? "Resume ▶" : "Pause Ⅱ"}</button> : <button onClick={launch}>{ended ? "Fly again ↻" : "Launch ✦"}</button>}</div>
      <div className={"lm-orbit-scene" + (running && !paused ? " is-running" : "")} role="group" aria-label="Orbit Dash game field">
        <div className="lm-orbit-nebula"/><div className="lm-orbit-lanes">{Array.from({length:LANES},(_,i)=><button key={i} type="button" aria-label={"Move to lane "+(i+1)} onClick={()=>{if(runningRef.current&&!pausedRef.current){laneRef.current=i;setLane(i);}}} className={"lm-orbit-lane" + (lane===i?" active-lane":"")}/>)}</div>
        {drops.map(drop=><div key={drop.id} className={"lm-orbit-drop " + drop.kind} style={{left:(drop.lane*33.333+16.666)+"%",top:((drop.row+.5)/ROWS*100)+"%"}} aria-label={drop.kind}>{drop.kind==="star"?"✦":drop.kind==="moon"?"☾":drop.kind==="shield"?"⬡":"☄"}</div>)}
        <div className="lm-orbit-player" style={{left:(lane*33.333+16.666)+"%"}}><span>✧</span><i/></div>
        {(!running || paused) && <div className="lm-orbit-overlay">{ended ? <><span>✦ FLIGHT LOG</span><strong>{score} stardust</strong><p>Every flight teaches you the rhythm of the sky.</p></> : paused ? <><span>FLIGHT PAUSED</span><strong>You're still in orbit.</strong><p>Resume when you're ready.</p></> : <><span>YOUR SHIP IS WAITING</span><strong>Ready, explorer?</strong><p>Use the arrows, A/D keys, or tap a lane to steer.</p></>}</div>}
      </div>
      <div className="lm-orbit-controls" aria-label="Steering controls"><button onClick={()=>move(-1)} disabled={!running || paused} aria-label="Steer left">←</button><div><span>{message}</span><small>← / → OR A / D · P TO PAUSE</small></div><button onClick={()=>move(1)} disabled={!running || paused} aria-label="Steer right">→</button></div>
      <div className="lm-orbit-legend"><span><b>✦</b> Star +1</span><span><b>☾</b> Moon +3</span><span><b>⬡</b> Shield refill</span><span><b>☄</b> Comet −1 shield</span></div>
      <div className="lm-orbit-mission"><span>✧ PILOT TIP</span><p>Keep a five-pickup streak for a <strong>+4 combo bonus</strong>. Each ten stardust makes the sky move faster. You can tap any lane on the field on mobile.</p></div>
      {ended && <div className="lm-game-win" role="status"><span>✦</span><h3>Flight complete.</h3><p>You collected {score} stardust. Your best flight is {Math.max(best,score)}. Ready for another little adventure?</p><button onClick={launch}>Launch again ↗</button></div>}
    </section>
    <footer className="lm-story-bottom"><span>✧</span><p>A tiny adventure, whenever you need a break.</p><Link href="/stories">Read a story ↗</Link></footer>
    <MobileNav/>
  </main>;
}
