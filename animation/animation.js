const CENTER = 500;

const PLANETS = [
  { id: 'orbit-mercury',  period: 4,   dir: 1  },
  { id: 'orbit-venus',    period: 7,   dir: 1  },
  { id: 'orbit-earth',    period: 10,  dir: 1  },
  { id: 'orbit-mars',     period: 14,  dir: 1  },
  { id: 'orbit-jupiter',  period: 22,  dir: 1  },
  { id: 'orbit-saturn',   period: 30,  dir: 1  },
  { id: 'orbit-uranus',   period: 42,  dir: -1 },
  { id: 'orbit-neptune',  period: 55,  dir: 1  },
];

function generateStars() {
  const g = document.getElementById('stars');
  if (!g) return;
  const rng = (lo, hi) => lo + Math.random() * (hi - lo);
  for (let i = 0; i < 200; i++) {
    const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c.setAttribute('cx', rng(0, 1000));
    c.setAttribute('cy', rng(0, 1000));
    c.setAttribute('r', rng(0.3, 1.2));
    c.setAttribute('fill', '#fff');
    c.setAttribute('opacity', rng(0.15, 0.6));
    g.appendChild(c);
  }
}

function twinkleStars() {
  const stars = document.querySelectorAll('#stars circle');
  stars.forEach((s) => {
    gsap.to(s, {
      opacity: parseFloat(s.getAttribute('opacity')) > 0.35 ? 0.1 : 0.65,
      duration: gsap.utils.random(1.5, 4),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: gsap.utils.random(0, 3),
    });
  });
}

function animateSun() {
  const sun = document.getElementById('sun');
  const halo = document.getElementById('sunHaloCircle');
  if (!sun) return;

  gsap.to(sun, {
    attr: { r: 42 },
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  if (halo) {
    gsap.to(halo, {
      attr: { r: 100 },
      opacity: 0.8,
      duration: 3,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });
  }
}

function animateOrbits(timescale) {
  const tweens = [];
  PLANETS.forEach((p) => {
    const el = document.getElementById(p.id);
    if (!el) return;
    const tw = gsap.to(el, {
      rotation: 360 * p.dir,
      duration: p.period,
      repeat: -1,
      ease: 'none',
      svgOrigin: `${CENTER} ${CENTER}`,
    });
    tw.timeScale(timescale);
    tweens.push(tw);
  });
  return tweens;
}

function animateMoon() {
  const moonOrbit = document.getElementById('orbit-moon');
  if (!moonOrbit) return;
  const earthEl = document.getElementById('earth');
  if (!earthEl) return;
  const ecx = parseFloat(earthEl.getAttribute('cx'));
  const ecy = parseFloat(earthEl.getAttribute('cy'));
  gsap.to(moonOrbit, {
    rotation: 360,
    duration: 2.5,
    repeat: -1,
    ease: 'none',
    svgOrigin: `${ecx} ${ecy}`,
  });
}

function setupTooltips() {
  const tooltip = document.getElementById('tooltip');
  if (!tooltip) return;

  document.querySelectorAll('.planet').forEach((planet) => {
    const orbit = planet.closest('g[data-name]');
    if (!orbit) return;
    const name = orbit.dataset.name;
    const info = orbit.dataset.info;

    planet.addEventListener('mouseenter', (e) => {
      tooltip.textContent = `${name} — ${info}`;
      gsap.to(tooltip, { opacity: 1, duration: 0.2 });
    });

    planet.addEventListener('mousemove', (e) => {
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY + 14 + 'px';
    });

    planet.addEventListener('mouseleave', () => {
      gsap.to(tooltip, { opacity: 0, duration: 0.15 });
    });
  });
}

function setupPlanetClick() {
  document.querySelectorAll('.planet').forEach((planet) => {
    planet.addEventListener('click', () => {
      gsap.timeline()
        .to(planet, { scale: 1.6, duration: 0.15, transformOrigin: '50% 50%', ease: 'back.out(2)' })
        .to(planet, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

function setupSunClick(tweens) {
  const sun = document.getElementById('sun');
  if (!sun) return;
  let fast = false;
  sun.addEventListener('click', () => {
    fast = !fast;
    const target = fast ? 3 : 1;
    tweens.forEach((tw) => {
      gsap.to(tw, { timeScale: target, duration: 0.8, ease: 'power2.inOut' });
    });
    gsap.to(sun, {
      attr: { r: fast ? 46 : 40 },
      duration: 0.4,
      ease: 'back.out(1.4)',
    });
  });
}

export function initAnimations() {
  generateStars();
  twinkleStars();
  animateSun();
  const tweens = animateOrbits(1);
  animateMoon();
  setupTooltips();
  setupPlanetClick();
  setupSunClick(tweens);
}
