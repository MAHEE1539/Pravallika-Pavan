import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// Main App: multi-scene romantic experience
export default function App() {
  const [scene, setScene] = useState(0); // 0: Landing,1: Letter,2: Question,3: Memory,4: Celebration
  const [noAttempts, setNoAttempts] = useState(0);
  const [noHint, setNoHint] = useState('No 😢');
  const [noSpeed, setNoSpeed] = useState(0.6); // transition duration (lower = faster)
  const containerRef = useRef(null);
  const scenesContainerRef = useRef(null);
  const scenesRefs = useRef([]);

  // Advance scene safely: scroll scene into view and update hash
  const goTo = (index) => {
    const i = Math.max(0, Math.min(4, index));
    const el = scenesRefs.current[i];
    if (el && el.scrollIntoView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setScene(i);
    try {
      window.history.replaceState(null, '', `#scene-${i}`);
    } catch (e) {}
  };

  // Sync scene with scroll position (native scroll snapping)
  useEffect(() => {
    const sc = scenesContainerRef.current;
    if (!sc) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(sc.scrollTop / window.innerHeight);
        if (idx !== scene) setScene(idx);
      });
    };
    sc.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      sc.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [scene]);

  // Read hash on mount to support multi-page feel
  useEffect(() => {
    const h = window.location.hash.match(/scene-(\d)/);
    if (h) {
      const i = Number(h[1]);
      setTimeout(() => goTo(i), 60);
    }
    // keyboard navigation
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown'].includes(e.key)) goTo(Math.min(4, scene + 1));
      if (['ArrowUp', 'PageUp'].includes(e.key)) goTo(Math.max(0, scene - 1));
      if (e.key === 'Home') goTo(0);
      if (e.key === 'End') goTo(4);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // click to advance: if clicking on blank area, go to next scene
  const handleContainerClick = (e) => {
    const tag = e.target.tagName && e.target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'a' || e.target.closest('.card') || e.target.closest('.no-btn')) return;
    goTo(Math.min(4, scene + 1));
  };

  // NOTE: NO button hint and behavior handled in dodgeNo

  // Create small hearts burst (Memory scene photo click)
  const burstHearts = (x = window.innerWidth / 2, y = window.innerHeight / 2) => {
    const container = containerRef.current;
    if (!container) return;
    for (let i = 0; i < 20; i++) {
      const h = document.createElement('div');
      h.className = 'burst-heart';
      h.style.left = `${x + (Math.random() - 0.5) * 120}px`;
      h.style.top = `${y + (Math.random() - 0.5) * 40}px`;
      h.style.setProperty('--d', `${Math.random() * 1.2 + 0.6}s`);
      container.appendChild(h);
      setTimeout(() => h.remove(), 2000);
    }
  };

  // Reveal final valentine card: navigate to final scene and celebrate
  const revealCard = () => {
    goTo(4);
    setTimeout(() => celebrate(), 500);
  };

  // Trigger celebration: confetti + hearts
  const celebrate = () => {
    goTo(4);
    const container = containerRef.current;
    if (!container) return;
    // flower shower: create many petals that fall with random timing
    const colors = ['#ff7b9a', '#ffd6e0', '#fff0f5', '#ff4d6d'];
    const petalCount = 80;
    for (let i = 0; i < petalCount; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      const left = Math.random() * 100;
      p.style.left = `${left}%`;
      p.style.fontSize = `${Math.random() * 14 + 12}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      const dur = Math.random() * 4 + 4; // 4-8s
      p.style.animationDuration = `${dur}s`;
      p.style.opacity = `${0.8 + Math.random() * 0.3}`;
      container.appendChild(p);
      setTimeout(() => p.remove(), dur * 1000 + 1200);
    }
    // gentle heart accents
    for (let i = 0; i < 16; i++) {
      const h = document.createElement('div');
      h.className = 'drop-heart';
      h.style.left = `${Math.random() * 100}%`;
      container.appendChild(h);
      setTimeout(() => h.remove(), 5000 + Math.random() * 3000);
    }
  };

  // burst flowers quickly at x,y (used when YES clicked to lead into memory scene)
  const burstFlowers = (x = window.innerWidth / 2, y = window.innerHeight / 2) => {
    const container = containerRef.current;
    if (!container) return;
    const colors = ['#ff7b9a', '#ffd6e0', '#fff0f5', '#ff4d6d'];
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'petal';
      p.style.left = `${x + (Math.random() - 0.5) * 160}px`;
      p.style.top = `${y + (Math.random() - 0.5) * 80}px`;
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.animationDuration = `${1.6 + Math.random() * 2.2}s`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 2400);
    }
  };

  // NO button dodge: moves to random position inside question area
  const dodgeNo = (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const parent = btn.parentElement;
    if (!parent) return;

    setNoAttempts((n) => {
      const newN = n + 1;
      // final message after 3 attempts
      if (newN >= 3) {
        setNoHint('Please click on yes ❤️');
        btn.style.transition = `all 240ms ease`;
        btn.style.position = 'absolute';
        // tuck the button near top-right of its wrapper but visible
        btn.style.left = `${Math.max(8, parent.clientWidth - btn.clientWidth - 28)}px`;
        btn.style.top = `8px`;
        btn.classList.add('final');
        return newN;
      }

      // otherwise move to a different random location (avoid previous)
      const pw = Math.max(20, parent.clientWidth - btn.clientWidth - 20);
      const ph = Math.max(20, parent.clientHeight - btn.clientHeight - 20);
      let left, top;
      const lastX = parseFloat(btn.dataset.lastX || '-9999');
      const lastY = parseFloat(btn.dataset.lastY || '-9999');
      let tries = 0;
      do {
        left = Math.random() * pw;
        top = Math.random() * ph;
        tries++;
        if (tries > 30) break;
      } while (Math.hypot(left - lastX, top - lastY) < 60);
      btn.dataset.lastX = left;
      btn.dataset.lastY = top;

      const speed = Math.max(0.04, noSpeed * Math.pow(0.7, newN - 1));
      btn.style.transition = `left ${speed}s ease, top ${speed}s ease, transform .12s`;
      btn.style.position = 'absolute';
      btn.style.left = `${left}px`;
      btn.style.top = `${top}px`;

      // update hint for playful messaging
      const hints = ['Are you sure?', 'Think again'];
      setNoHint(hints[Math.min(newN - 1, hints.length - 1)]);

      return newN;
    });
  };

  // when YES clicked -> go to memory (scene 3) and show a small flower burst
  const onYes = (e) => {
    e.stopPropagation();
    // approximate center of viewport
    burstFlowers(window.innerWidth / 2, window.innerHeight / 2 - 80);
    goTo(3);
  };

  return (
    <div className={`valentine-app scene-${scene}`} ref={containerRef}>
      <Background />
      <main className="scenes" ref={scenesContainerRef} onClick={handleContainerClick}>
        <Scene ref={(el) => (scenesRefs.current[0] = el)} active={scene === 0}>
          <div className="landing">
            <h2 className="greeting">Hey you...</h2>
            <p className="sub">I made something for you</p>
            <button className="open-btn" onClick={() => goTo(1)}>
              Open it ❤️
            </button>
            <div className="credit">Presented by Pravallika for Pavan</div>
          </div>
        </Scene>

        <Scene ref={(el) => (scenesRefs.current[1] = el)} active={scene === 1}>
          <div className="letter-wrapper">
            <div className="card">
              <p className="typewriter">
                <span>"I don't know how you did it..."</span>
                <br />
                <span>"But you became my peace,</span>
                <br />
                <span>my happiness,</span>
                <br />
                <span>and my home."</span>
                <br />
                <strong className="big">So today I wanted to ask you something...</strong>
              </p>
              <div className="card-actions">
                <button onClick={() => goTo(2)}>Continue →</button>
              </div>
            </div>
          </div>
        </Scene>

        <Scene ref={(el) => (scenesRefs.current[2] = el)} active={scene === 2}>
          <div className="question-scene">
            <h1 className="ask">Will you be my Valentine?</h1>
            <div className="choices">
              <button className="yes-btn" onClick={onYes} onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>YES 💖</button>
              <div className="no-wrapper">
                <button
                  className="no-btn"
                  onMouseEnter={dodgeNo}
                  onClick={dodgeNo}
                  aria-label="No button"
                >
                  {noHint}
                </button>
              </div>
            </div>
            <p className="hint">(Try to catch the <em>no</em> button—it's shy.)</p>
          </div>
        </Scene>

        <Scene ref={(el) => (scenesRefs.current[3] = el)} active={scene === 3}>
          <div className="memory-scene">
            <div className="photo-polaroid" onClick={(e) => burstHearts(e.clientX, e.clientY)}>
              <img src="/assets/us.jpeg" alt="us" />
              <div className="caption">My favorite place is wherever you are ❤️</div>
            </div>
            <div className="memory-texts">
              <p>Every moment with you...</p>
              <p className="fade-2">became my favorite memory</p>
              <button className="reveal-btn" onClick={revealCard}>Open the card 💌</button>
            </div>
          </div>
        </Scene>
        <Scene ref={(el) => (scenesRefs.current[4] = el)} active={scene === 4}>
          <div className="celebrate revealed">
            <h2>I knew it 😌❤️</h2>
            <p className="large">Happy Valentine's Day, my love</p>
            <div className="big-photo card-final">
              <div className="card-front final-card">
                <h3>Thankyou for being my Valentine</h3>
                <p>With all my heart — forever and always.</p>
                <div className="small-heart">❤️</div>
              </div>
            </div>
            <p className="final">Now you officially belong to me 😌</p>
          </div>
        </Scene>
      </main>
    </div>
  );
}

// Simple Scene wrapper
const Scene = React.forwardRef(function Scene({ children, active }, ref) {
  return (
    <section ref={ref} className={`scene ${active ? 'active' : ''}`}>
      {children}
    </section>
  );
});

// Background component: gradient, floating hearts and sparkles
function Background() {
  return (
    <div className="bg">
      <div className="glow" />
      <div className="hearts-bg">
        <span className="h h1">❤</span>
        <span className="h h2">❤</span>
        <span className="h h3">❤</span>
      </div>
      <div className="sparkles">
        <i />
        <i />
        <i />
      </div>
      <div className="ribbon" />
      <div className="bokeh" />
      <div className="vignette" />
      <div className="lantern" />
    </div>
  );
}

