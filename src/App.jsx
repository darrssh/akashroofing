import React, { useEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import RoofScene from './three/RoofScene.jsx';
import { SERVICES, TESTIMONIALS, STATS, PHONES, EMAIL, ADDRESS, INSTAGRAM, HERO_IMAGES, waLink } from './content.js';
import './styles.css';

const NAV = [
  { id: 'top', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'story', label: '3D Experience' },
  { id: 'services', label: 'Services' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'contact', label: 'Contact' },
];

function useScrollProgress() {
  const [v, setV] = useState(0);
  useEffect(() => {
    const on = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setV(max > 0 ? h.scrollTop / max : 0);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return v;
}

function Counter({ value, suffix }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0; let started = false;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) {
        started = true;
        const t0 = performance.now();
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / 1600);
          setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return <span ref={ref}>{n.toLocaleString('en-IN')}{suffix}</span>;
}

export default function App() {
  const progress = useScrollProgress();
  const [active, setActive] = useState(0); // story index
  const [stageFloat, setStageFloat] = useState(0); // continuous 0..5.x for smooth 3D morph
  const [serviceTab, setServiceTab] = useState(SERVICES[0].id);
  const [menu, setMenu] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', service: SERVICES[0].title, size: '' });
  const storyRefs = useRef([]);
  const storySectionRef = useRef(null);

  const storySteps = useMemo(() => SERVICES.slice(0, 6), []);
  const currentStage = storySteps[Math.min(active, storySteps.length - 1)];

  // Robust scroll mapping: continuous float + nearest-step active.
  // Runs on scroll/resize/load (covers lazy-image layout shifts that broke the old observer-only approach).
  useEffect(() => {
    let raf = 0;
    const compute = () => {
      raf = 0;
      const els = storyRefs.current.filter(Boolean);
      if (!els.length) return;
      const center = window.innerHeight * 0.5;
      let best = 0; let bestDist = Infinity;
      let float = 0;
      els.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height / 2 - center);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      // fractional progress between best and neighbour for smooth morph
      const cur = els[best].getBoundingClientRect();
      const curCenter = cur.top + cur.height / 2;
      let frac = 0;
      if (curCenter > center && best < els.length - 1) {
        const nxt = els[best + 1].getBoundingClientRect();
        const span = (nxt.top + nxt.height / 2) - curCenter || 1;
        frac = Math.min(1, Math.max(0, (center - curCenter) / span));
      } else if (curCenter < center && best > 0) {
        const prv = els[best - 1].getBoundingClientRect();
        const span = curCenter - (prv.top + prv.height / 2) || 1;
        frac = -Math.min(1, Math.max(0, (curCenter - center) / span));
      }
      float = Math.min(els.length - 1, Math.max(0, best + frac));
      setActive((a) => (a === best ? a : best));
      setStageFloat(float);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', onScroll);
    // re-compute shortly after mount to survive late image layout shifts
    const t1 = setTimeout(compute, 600);
    const t2 = setTimeout(compute, 2000);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); window.removeEventListener('load', onScroll); clearTimeout(t1); clearTimeout(t2); if (raf) cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    // Secondary observer as enhancement (multiple thresholds = fires reliably)
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          const i = Number(e.target.dataset.i);
          if (!Number.isNaN(i)) setActive((a) => (Math.abs(i - a) > 0 ? i : a));
        }
      });
    }, { rootMargin: '-30% 0px -30% 0px', threshold: [0, 0.25, 0.5] });
    const els = storyRefs.current.filter(Boolean);
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [storySteps.length]);

  const go = (id) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const selected = SERVICES.find((s) => s.id === serviceTab);

  const submitQuote = (e) => {
    e.preventDefault();
    const msg = `Hi Akash Roofing Solution, I'm ${form.name} (${form.phone}). I need ${form.service}, approx ${form.size || '—'} sqft. Please share free estimate.`;
    window.open(waLink(msg), '_blank');
  };

  return (
    <div id="top" className="page">
      <div className="scrollbar"><div style={{ transform: `scaleX(${progress})` }} /></div>

      <header className="nav">
        <button className="brand" onClick={() => go('top')}>
          <span className="brand-mark">⌂</span>
          <span><b>AKASH</b> ROOFING <em>SOLUTION</em></span>
        </button>
        <nav className="links">
          {NAV.map((n) => <button key={n.id} onClick={() => go(n.id)}>{n.label}</button>)}
        </nav>
        <div className="nav-cta">
          <a className="btn ghost" href={`tel:${PHONES[0]}`}>◷ {PHONES[0]}</a>
          <button className="btn solid" onClick={() => go('contact')}>Book Now</button>
          <button className="burger" onClick={() => setMenu(!menu)}>☰</button>
        </div>
      </header>
      {menu && (
        <div className="mobile-menu">
          {NAV.map((n) => <button key={n.id} onClick={() => go(n.id)}>{n.label}</button>)}
        </div>
      )}

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="pill">● Bengaluru • Since 2008 • 20+ Years • 100% Satisfaction</div>
            <p className="eyebrow">Welcome to Akash Roofing Solution</p>
            <h1>Best Roofing Services in <span>Bengaluru</span> — crafted to be seen.</h1>
            <p className="sub">Real projects. Real materials. Scroll and watch our 3D roof build itself — tiles fly in, PUF layers explode, glass turns transparent. Premium rebuild with same trusted content.</p>
            <div className="row">
              <button className="btn solid big" onClick={() => go('story')}>▶ Start 3D scroll story</button>
              <button className="btn ghost big" onClick={() => go('gallery')}>See real work</button>
            </div>
            <div className="hero-photos">
              {HERO_IMAGES.map((src, i) => (
                <figure key={i} className={`hph hph${i}`}>
                  <img src={src} alt={`Akash Roofing real project ${i + 1}`} loading={i === 0 ? 'eager' : 'lazy'} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  <figcaption>{['Mangaluru Tile Pergola', 'Terrace Tile Roof', 'Glass Pergola'][i]}</figcaption>
                </figure>
              ))}
            </div>
            <div className="trust">
              <div><b>100%</b><span>Satisfaction</span></div>
              <div><b>45+</b><span>Experts</span></div>
              <div><b>11</b><span>Roof systems</span></div>
              <div><b>20+</b><span>Years</span></div>
            </div>
          </div>
          <div className="hero-3d">
            <Canvas dpr={[1, 1.8]} camera={{ position: [0, 3.6, 10.5], fov: 42 }}>
              <Suspense fallback={null}>
                <RoofScene stage={currentStage} scrollY={progress} />
              </Suspense>
            </Canvas>
            <div className="hero-hud">
              <span>LIVE 3D • {currentStage?.tab} • drag to rotate</span>
              <span className="dotlive" />
            </div>
            <div className="hero-badge">★ 4.9 rated in Bengaluru</div>
          </div>
        </div>
        <div className="marquee"><div className="marquee-track"><span>MANGALURU TILE • PUF PANEL • GLASS PERGOLA • SHINGLES • THATCH • NANO CERAMIC • SKYLIGHT • PEB • GUTTER • FALSE CEILING • WPC •&nbsp;</span><span>MANGALURU TILE • PUF PANEL • GLASS PERGOLA • SHINGLES • THATCH • NANO CERAMIC • SKYLIGHT • PEB • GUTTER • FALSE CEILING • WPC •&nbsp;</span></div></div>
        <div className="scroll-cue">SCROLL ↓ TO BUILD THE ROOF</div>
      </section>

      {/* MISSION STRIP */}
      <section className="strip">
        <div className="strip-card"><h4>MISSION</h4><p>To deliver top-quality, reliable roofing services that ensure customer satisfaction and long-lasting protection for homes and businesses.</p></div>
        <div className="strip-card"><h4>VISION</h4><p>To be the trusted leader in roofing solutions, known for excellence, innovation, and unmatched customer care.</p></div>
        <div className="strip-card"><h4>TECHNOLOGY</h4><p>We utilize the latest roofing technologies and tools to ensure efficient, precise, and durable installations and repairs.</p></div>
      </section>

      {/* 3D SCROLL STORY */}
      <section id="story" className="story" ref={storySectionRef}>
        <div className="story-head">
          <p className="eyebrow">Scroll-based product explanation</p>
          <h2>The roof transforms <span>as you scroll.</span></h2>
          <p className="sub">6 chapters • same 3D house • material morphs live. Keep scrolling — the 3D roof rebuilds itself chapter by chapter.</p>
          <div className="progress-steps">
            {storySteps.map((s, i) => (
              <button key={s.id} aria-label={`Go to ${s.tab}`} className={i === Math.round(stageFloat) ? 'on' : i < stageFloat ? 'done' : ''} onClick={() => storyRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{i + 1}</button>
            ))}
          </div>
          <div className="story-progress"><div style={{ transform: `scaleX(${(stageFloat / (storySteps.length - 1)) * 100}%)` }} /></div>
        </div>
        <div className="story-grid">
          <div className="story-view">
            <div className="sticky-canvas">
              <Canvas dpr={[1, 1.8]} camera={{ position: [0, 3.6, 10.5], fov: 42 }}>
                <Suspense fallback={null}>
                  <RoofScene stages={storySteps} stageFloat={stageFloat} scrollY={0.25 + (stageFloat / storySteps.length) * 0.7} />
                </Suspense>
              </Canvas>
              <div className="stage-chip">{Math.round(stageFloat) + 1} / 6 — {storySteps[Math.round(stageFloat)]?.title}</div>
            </div>
          </div>
          <div className="story-steps">
            {storySteps.map((s, i) => (
              <article key={s.id} id={`story-step-${i}`} data-i={i} ref={(el) => { if (el) storyRefs.current[i] = el; }} className={`step ${i === active ? 'on' : ''}`}>
                <div className="step-img"><img src={s.image} alt={s.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} /><span className="step-no">0{i + 1} • REAL PROJECT</span></div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <ul>{s.points.map((p) => <li key={p}>✓ {p}</li>)}</ul>
                <div className="row">
                  <a className="btn solid sm" target="_blank" rel="noreferrer" href={waLink(`Hi, I want quote for ${s.title}`)}>Book {s.tab} →</a>
                  <span className="swatch" style={{ background: s.color }} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="about">
        <div>
          <p className="eyebrow">About • Quality & Reliability with 100% Satisfaction</p>
          <h2>We care for your roof <span>as if it were our own.</span></h2>
          <p>At <b>Akash Roofing Solutions</b>, we are committed to top-quality roofing — repairs, replacements, maintenance — done with precision and care. Founded in <b>2008 by Mr. Mallesh KP</b> after years with a large roofing company, focused on residential roofing.</p>
          <div className="about-grid">
            <div><b>Expertise</b><p>Asphalt shingle, flat roofing, eco-friendly green roofs. Certified by multiple manufacturers.</p></div>
            <div><b>Growth</b><p>Serving wide area with 45+ skilled workers — small homes to large commercial contracts.</p></div>
            <div><b>Philosophy</b><p>Honest transparent pricing. Every client fully satisfied. Known for reliability, quality, service.</p></div>
          </div>
        </div>
        <div className="about-card">
          <div className="founder">MK</div>
          <h4>Mr. Mallesh KP — Founder</h4>
          <p>“Provide honest pricing and ensure every client is fully satisfied.”</p>
          <div className="row"><a className="btn solid sm" href={INSTAGRAM} target="_blank" rel="noreferrer">Instagram ↗</a><a className="btn ghost sm" href={`tel:${PHONES[0]}`}>Call Founder</a></div>
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" className="services">
        <p className="eyebrow">Our Services</p>
        <h2>Best roofing service. <span>Reasonable price. Best after-support.</span></h2>
        <div className="tabs">
          {SERVICES.map((s) => (
            <button key={s.id} className={s.id === serviceTab ? 'on' : ''} onClick={() => setServiceTab(s.id)}>{s.tab}</button>
          ))}
        </div>
        {selected && (
          <div className="service-detail">
            <div className="sd-visual">
              <img src={selected.image} alt={selected.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <span>{selected.roof.toUpperCase()} SYSTEM • REAL PHOTO</span>
            </div>
            <div>
              <h3>{selected.title}</h3>
              <p className="sub">{selected.short}</p>
              <p>{selected.desc}</p>
              <ul className="ticks">{selected.points.map((p) => <li key={p}>✓ {p}</li>)}</ul>
              <div className="row">
                <a className="btn solid" target="_blank" rel="noreferrer" href={waLink(`Hi, I want quote for ${selected.title}`)}>Book Now on WhatsApp</a>
                <button className="btn ghost" onClick={() => go('contact')}>Free Estimate</button>
              </div>
            </div>
          </div>
        )}
        <div className="cards">
          {SERVICES.map((s) => (
            <button key={s.id} className={`card ${s.id === serviceTab ? 'on' : ''}`} onClick={() => setServiceTab(s.id)}>
              <span className="card-img"><img src={s.image} alt={s.title} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} /></span>
              <b>{s.title}</b><span>{s.short}</span>
            </button>
          ))}
        </div>
        <div className="features">
          {[['Reasonable Price', 'High-quality roofing at affordable transparent prices.'], ['Quality Maintenance', 'Remains durable, functional & long-lasting.'], ['Complete Inspection', 'Optimal condition, avoid future problems proactively.'], ['Free Estimates', 'Clear cost + scope before work begins.']].map(([t, d]) => (
            <div key={t} className="feat"><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>

      {/* PROCESS + WHY */}
      <section className="why">
        <div>
          <p className="eyebrow">Simple 3 Steps Process</p>
          <h2>From call to <span>covered.</span></h2>
          <ol className="steps">
            <li><b>1 — Free site visit & inspection</b><p>We measure, photograph, check structure & drainage. Transparent estimate same day.</p></li>
            <li><b>2 — Material & design lock</b><p>Choose tile / PUF / glass / shingle / thatch / ceramic with 3D preview + written quote.</p></li>
            <li><b>3 — Build + after-support</b><p>45+ crew executes on time, site left clean. Best after-support policy.</p></li>
          </ol>
        </div>
        <div>
          <p className="eyebrow">Why Choose Akash Roofing Solutions?</p>
          <ul className="whys">
            <li><b>Expertise & Experience:</b> 20+ years tailored roofing, all roof types.</li>
            <li><b>Quality Materials:</b> Premium, extreme-weather tested.</li>
            <li><b>Affordable & Transparent:</b> No hidden fees, upfront estimates.</li>
            <li><b>Reliable & Timely:</b> On time without compromising safety.</li>
            <li><b>Customer Satisfaction:</b> Vision realized, start to finish.</li>
          </ul>
          <button className="btn solid" onClick={() => go('gallery')}>Our Work →</button>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        {STATS.map((s) => (
          <div key={s.label} className="stat"><b><Counter value={s.value} suffix={s.suffix} /></b><span>{s.label}</span></div>
        ))}
      </section>

      {/* GALLERY */}
      <section id="gallery" className="gallery">
        <p className="eyebrow">Gallery • Real projects</p>
        <h2>Real sites. <span>Real roofs.</span></h2>
        <p className="sub">Live photos from akashroofingsolution.com — HBR Layout + across Bengaluru. Mangaluru tile, PUF, pergola, shingles, thatch, ceramic.</p>
        <div className="masonry">
          {SERVICES.map((s, i) => (
            <div key={s.id} className={`tile t${i % 4}`}>
              <img src={s.image} alt={`${s.title} project`} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.closest('.tile').style.display = 'none'; }} />
              <div className="tile-meta"><b>{s.tab}</b><span>Project {String(i + 1).padStart(2, '0')} • Bengaluru</span></div>
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="reviews">
        <p className="eyebrow">Testimonials</p>
        <h2>Loved across <span>Bengaluru & beyond.</span></h2>
        <div className="rev-grid">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rev"><div className="stars">★★★★★</div><blockquote>“{t.text}”</blockquote><figcaption>{t.name}</figcaption></figure>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact">
        <div>
          <p className="eyebrow">Contact our Technical Team</p>
          <h2>Get free estimate <span>in minutes.</span></h2>
          <p className="sub">Do you need help with products or service? Get in touch — form opens WhatsApp (works on GitHub Pages, no backend).</p>
          <div className="c-lines">
            <a href={`tel:${PHONES[0]}`}>📞 {PHONES[0]} / {PHONES[1]}</a>
            <a href={`mailto:${EMAIL}`}>✉ {EMAIL}</a>
            <span>📍 {ADDRESS}</span>
            <a href={INSTAGRAM} target="_blank" rel="noreferrer">📸 Instagram ↗</a>
          </div>
        </div>
        <form className="form" onSubmit={submitQuote}>
          <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" /></label>
          <label>Phone<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="98XXXXXXXX" /></label>
          <label>Service<select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>{SERVICES.map((s) => <option key={s.id}>{s.title}</option>)}</select></label>
          <label>Approx size (sqft)<input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="e.g. 1200" /></label>
          <button className="btn solid big" type="submit">Send on WhatsApp →</button>
          <small>No spam. Opens WhatsApp with prefilled quote to {PHONES[0]}.</small>
        </form>
      </section>

      <footer className="footer">
        <div><b>AKASH ROOFING SOLUTION</b><p>Best Roofing Services in Bengaluru. © 2026 akashroofingsolution</p></div>
        <div className="row">{NAV.map((n) => <button key={n.id} onClick={() => go(n.id)}>{n.label}</button>)}</div>
        <div><span>{PHONES.join(' / ')} • {EMAIL}</span></div>
      </footer>

      <div className="float">
        <a className="fbtn wa" target="_blank" rel="noreferrer" href={waLink('Hi Akash Roofing Solution, I need a quote.')}>✆</a>
        <a className="fbtn call" href={`tel:${PHONES[0]}`}>☎</a>
        <button className="fbtn top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>
      </div>
    </div>
  );
}
