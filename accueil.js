// L'ACCUEIL DU SITE — ce qui bouge et ce qui se joue.
// Aucune dépendance : un ciel dessiné à la main, une question jouable, une
// salle qui s'anime, des chiffres qui comptent. Tout se tait pour qui a demandé
// moins d'animations à son appareil.

const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ——— Le ciel : trois plans d'étoiles, qui suivent la souris et le défilement. ——— */
(() => {
  const toile = document.getElementById("ciel");
  if (!toile) return;
  const ctx = toile.getContext("2d");
  let l = 0, h = 0, etoiles = [], cible = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
  const plans = [0.15, 0.4, 0.9];
  function dimensionner() {
    const r = devicePixelRatio || 1;
    l = toile.clientWidth; h = toile.clientHeight;
    toile.width = l * r; toile.height = h * r; ctx.setTransform(r, 0, 0, r, 0, 0);
    const n = Math.round((l * h) / 2600);
    etoiles = Array.from({ length: n }, () => {
      const p = Math.floor(Math.random() * 3);
      return { x: Math.random() * l, y: Math.random() * h, p, t: Math.random() * 6.28, r: 0.4 + p * 0.45 + Math.random() * 0.5 };
    });
  }
  addEventListener("resize", dimensionner);
  addEventListener("pointermove", (e) => { cible.x = (e.clientX / innerWidth - 0.5) * 40; cible.y = (e.clientY / innerHeight - 0.5) * 30; });
  dimensionner();
  let filantes = [];
  function image(t) {
    cam.x += (cible.x - cam.x) * 0.05; cam.y += (cible.y - cam.y) * 0.05;
    const defil = scrollY * 0.25;
    ctx.clearRect(0, 0, l, h);
    for (const e of etoiles) {
      const v = plans[e.p];
      let x = (e.x - cam.x * v) % l; if (x < 0) x += l;
      let y = (e.y - cam.y * v - defil * v) % h; if (y < 0) y += h;
      const a = calme ? 0.7 : 0.45 + 0.45 * Math.sin(t / 900 + e.t);
      ctx.globalAlpha = a; ctx.fillStyle = e.p === 2 && e.t > 5.5 ? "#C9C4FF" : "#fff";
      ctx.beginPath(); ctx.arc(x, y, e.r, 0, 6.283); ctx.fill();
    }
    // Une étoile filante de temps en temps.
    if (!calme && Math.random() < 0.006) filantes.push({ x: Math.random() * l, y: Math.random() * h * 0.5, v: 9 + Math.random() * 6, vie: 1 });
    filantes = filantes.filter((f) => f.vie > 0);
    for (const f of filantes) {
      const g = ctx.createLinearGradient(f.x, f.y, f.x - 90, f.y - 40);
      g.addColorStop(0, `rgba(255,255,255,${f.vie})`); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - 90, f.y - 40); ctx.stroke();
      f.x += f.v; f.y += f.v * 0.44; f.vie -= 0.02;
    }
    ctx.globalAlpha = 1;
    // Le système suit la souris, un peu.
    const orrery = document.querySelector(".orrery");
    if (orrery) orrery.style.transform = `translate(${cam.x * 0.4}px, ${cam.y * 0.4}px)`;
    if (!calme) requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
})();

/* ——— Ce qui apparaît en défilant. ——— */
(() => {
  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) if (e.isIntersecting) { e.target.classList.add("vu"); obs.unobserve(e.target); }
  }, { threshold: 0.18 });
  document.querySelectorAll(".apparait, .carte-m").forEach((n) => obs.observe(n));
})();

/* ——— La question jouable. Trois vraies questions de la banque. ——— */
(() => {
  const racine = document.getElementById("demo");
  if (!racine) return;
  const QUESTIONS = [
    { monde: "Histoire", image: "histoire-france", enonce: "Quelle est la devise de la République française ?",
      juste: "Liberté, Égalité, Fraternité",
      faux: ["Liberté, Égalité, Justice", "Un roi, une loi, une foi", "Liberté, Égalité, Charcuterie"],
      explication: "Adoptée comme devise de l'État le 27 février 1848, elle est réaffirmée par l'article 2 de la Constitution de 1958." },
    { monde: "Sciences", image: "sciences-vie-terre", enonce: "En quelle année le premier homme marche-t-il sur la Lune ?",
      juste: "1969", faux: ["1965", "1971", "1974"],
      explication: "Le premier pas a eu lieu le 21 juillet 1969 à 2 h 56, heure de Paris. Environ 450 millions de personnes l'ont suivi en direct." },
    { monde: "Jeux vidéo", image: "culture-populaire", enonce: "Quelle créature de Minecraft explose quand elle s'approche du joueur ?",
      juste: "le Creeper", faux: ["l'Enderman", "le Zombie", "le Squelette"],
      explication: "Il est né d'une erreur de code : en fabriquant le cochon, son auteur a échangé la longueur et la hauteur du modèle — et l'a gardé." },
  ];
  const BRAVO = ["Bravo !", "Excellent !", "Époustouflant !"];
  const $ = (s) => racine.querySelector(s);
  let rang = 0, serie = 0, total = 0, justes = 0, minuterie = null, restant = 15;

  const melanger = (t) => t.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  const frimousse = (content) => content
    ? `<svg class="frimousse" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#B4EA6A" stroke="#15132E" stroke-width="3"/><path d="M12 17q2-4 5 0M23 17q2-4 5 0" stroke="#15132E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M11 23q9 11 18 0z" fill="#15132E"/></svg>`
    : `<svg class="frimousse" viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#EE6AA7" stroke="#15132E" stroke-width="3"/><circle cx="15" cy="18" r="2.6" fill="#15132E"/><circle cx="25" cy="18" r="2.6" fill="#15132E"/><path d="M13 26q8 5 14-2" stroke="#15132E" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;

  function chrono() {
    $(".chrono b").textContent = restant;
    $(".chrono .reste").style.strokeDashoffset = String(100 - (restant / 15) * 100);
    $(".chrono .reste").style.stroke = restant <= 5 ? "var(--rose)" : "var(--jaune)";
  }

  function poser() {
    const q = QUESTIONS[rang];
    $(".fin-demo").classList.remove("vue");
    $(".panneau").classList.remove("ouvert", "rate");
    $(".monde-q").innerHTML = `<img src="images/planete-${q.image}.webp" alt="">${q.monde}`;
    $(".enonce").textContent = q.enonce;
    $(".progres i").style.width = `${(rang / QUESTIONS.length) * 100}%`;
    const liste = $(".choix"); liste.classList.remove("fige"); liste.innerHTML = "";
    melanger([q.juste, ...q.faux]).forEach((texte, i) => {
      const b = document.createElement("button");
      b.innerHTML = `<b>${"ABCD"[i]}</b><span></span>`; b.querySelector("span").textContent = texte;
      b.addEventListener("click", () => repondre(texte, b));
      liste.appendChild(b);
    });
    restant = 15; chrono();
    clearInterval(minuterie);
    minuterie = setInterval(() => { restant -= 1; chrono(); if (restant <= 0) repondre(null, null); }, 1000);
  }

  function repondre(texte, bouton) {
    clearInterval(minuterie);
    const q = QUESTIONS[rang], liste = $(".choix");
    if (liste.classList.contains("fige")) return;
    liste.classList.add("fige");
    const bon = texte === q.juste;
    liste.querySelectorAll("button").forEach((b) => { if (b.querySelector("span").textContent === q.juste) b.classList.add("juste"); });
    if (!bon && bouton) bouton.classList.add("choisi");
    const panneau = $(".panneau");
    panneau.classList.toggle("rate", !bon);
    let gain = 0;
    if (bon) { serie += 1; justes += 1; gain = 100 + restant * 4; total += gain; } else serie = 0;
    $(".verdict").innerHTML = `${frimousse(bon)}<span>${bon ? BRAVO[Math.min(serie, 3) - 1] : "Tu la sauras !"}</span>${gain ? `<span class="pts">+${gain}</span>` : ""}`;
    $(".reponse-dite").innerHTML = bon ? "" : `La réponse : <strong></strong>`;
    if (!bon) $(".reponse-dite strong").textContent = q.juste;
    $(".explication").textContent = q.explication;
    $(".serie").textContent = serie >= 2 ? `SÉRIE ×${serie}` : "";
    $(".suivante").textContent = rang === QUESTIONS.length - 1 ? "Voir mon score" : "Suivante";
    panneau.classList.add("ouvert");
    if (bon && bouton) {
      const v = document.createElement("div"); v.className = "points-volants"; v.textContent = `+${gain}`;
      const r = bouton.getBoundingClientRect(), e = racine.querySelector(".ecran").getBoundingClientRect();
      v.style.left = `${r.right - e.left - 70}px`; v.style.top = `${r.top - e.top}px`;
      racine.querySelector(".ecran").appendChild(v); setTimeout(() => v.remove(), 1200);
    }
  }

  $(".suivante").addEventListener("click", () => {
    if (rang < QUESTIONS.length - 1) { rang += 1; poser(); return; }
    $(".progres i").style.width = "100%";
    $(".panneau").classList.remove("ouvert");
    $(".fin-demo strong").textContent = total;
    $(".fin-demo p").textContent = justes === QUESTIONS.length
      ? "Sans faute. Il en reste 962 dans le jeu."
      : `${justes} sur ${QUESTIONS.length}. Il en reste 962 dans le jeu pour progresser.`;
    $(".fin-demo").classList.add("vue");
  });
  $(".rejouer").addEventListener("click", () => { rang = 0; serie = 0; total = 0; justes = 0; $(".serie").textContent = ""; poser(); });

  // On ne lance le chrono que lorsque le téléphone est à l'écran.
  let lance = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !lance) { lance = true; poser(); } }, { threshold: 0.5 }).observe(racine);
})();

/* ——— La salle qui s'anime. ——— */
(() => {
  const salle = document.getElementById("salle");
  if (!salle) return;
  const joueurs = [...salle.querySelectorAll(".joueur")];
  const annonce = salle.querySelector(".annonce");
  const numero = salle.querySelector(".q-en-cours b");
  const ANNONCES = [
    "Noé répond le premier. Rapide comme l'éclair.",
    "Trois bonnes réponses d'affilée pour Léa. Ça gèèère.",
    "Personne n'a trouvé : la question a gagné cette manche.",
    "Sam prend son temps… méfiance.",
    "Noé passe devant Papa. Le classement tremble.",
  ];
  let q = 3, a = 0;
  function tour() {
    joueurs.forEach((j) => j.classList.remove("a-repondu"));
    numero.textContent = String(q).padStart(2, "0");
    const ordre = joueurs.map((j) => j).sort(() => Math.random() - 0.5);
    ordre.forEach((j, i) => setTimeout(() => j.classList.add("a-repondu"), 700 + i * (500 + Math.random() * 900)));
    setTimeout(() => {
      joueurs.forEach((j) => { const s = j.querySelector("small"); s.textContent = String(+s.textContent + (Math.random() < 0.7 ? 100 + Math.round(Math.random() * 50) : 0)); });
      annonce.style.opacity = 0;
      setTimeout(() => { annonce.textContent = ANNONCES[a++ % ANNONCES.length]; annonce.style.opacity = 1; }, 300);
      q = q >= 20 ? 1 : q + 1;
    }, 4600);
  }
  let lancee = false;
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !lancee) { lancee = true; tour(); setInterval(tour, 6000); } }, { threshold: 0.3 }).observe(salle);
})();

/* ——— Les routes des formats : un vaisseau allume les escales. ——— */
(() => {
  document.querySelectorAll(".route").forEach((route) => {
    const n = +route.dataset.escales, duree = +route.dataset.duree, fin = route.dataset.fin !== "non";
    for (let i = 0; i < n; i += 1) { const e = document.createElement("i"); e.style.left = `${((i + 1) / (n + (fin ? 1 : 0))) * (fin ? 100 : 108)}%`; route.appendChild(e); }
    const v = document.createElement("span"); v.className = "vaisseau"; route.appendChild(v);
    const escales = [...route.querySelectorAll("i")];
    let debut = null;
    function image(t) {
      if (debut === null) debut = t;
      const p = ((t - debut) % (duree + 900)) / duree;
      const pos = Math.min(p, 1) * 100;
      v.style.left = `${pos}%`;
      escales.forEach((e) => e.classList.toggle("allumee", parseFloat(e.style.left) <= pos && p <= 1));
      requestAnimationFrame(image);
    }
    if (!calme) requestAnimationFrame(image);
  });
})();

/* ——— Les chiffres qui comptent jusqu'à leur valeur. ——— */
(() => {
  const obs = new IntersectionObserver((entrees) => {
    for (const e of entrees) {
      if (!e.isIntersecting) continue;
      obs.unobserve(e.target);
      const cible = +e.target.dataset.valeur, debut = performance.now();
      const pas = (t) => {
        const p = Math.min((t - debut) / 1600, 1), f = 1 - Math.pow(1 - p, 3);
        e.target.textContent = Math.round(cible * f);
        if (p < 1) requestAnimationFrame(pas);
      };
      if (calme) e.target.textContent = cible; else requestAnimationFrame(pas);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-valeur]").forEach((n) => obs.observe(n));
})();

/* ——— Le carrousel des ports se tire à la souris. ——— */
(() => {
  const ports = document.querySelector(".ports");
  if (!ports) return;
  let x0 = null, s0 = 0;
  ports.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; x0 = e.clientX; s0 = ports.scrollLeft; ports.classList.add("saisi"); });
  addEventListener("pointermove", (e) => { if (x0 !== null) ports.scrollLeft = s0 - (e.clientX - x0); });
  addEventListener("pointerup", () => { x0 = null; ports.classList.remove("saisi"); });
})();
