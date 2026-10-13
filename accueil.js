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
    if (!calme) requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
})();

/* ——— Le système de l'ouverture : des orbites vraies autour d'un trou noir fixe. ———
   Chaque planète suit une ellipse aplatie comme le disque du trou noir, à sa
   vitesse : la plus proche va le plus vite (troisième loi de Kepler). Sur la
   moitié du haut, elle passe DERRIÈRE le trou noir — plus petite, plus sombre,
   sous l'image ; sur la moitié du bas, elle passe DEVANT. Rien d'autre ne
   bouge : le trou noir est une image fixe, seule l'étoile qu'il avale s'écoule. */
(() => {
  const systeme = document.querySelector(".orrery");
  if (!systeme) return;
  const orbes = [...systeme.querySelectorAll(".orbe")];
  // Centre de l'ombre et orbites, dans le repère 1000 × 600 du système.
  const CX = 499, CY = 293;
  const ORBITES = [
    { rx: 290, ry: 128, phase: 0.5 },
    { rx: 355, ry: 150, phase: 2.6 },
    { rx: 420, ry: 170, phase: 4.2 },
    { rx: 478, ry: 188, phase: 5.6 },
  ];
  const PERIODE = 70; // secondes, pour l'orbite la plus proche
  const INCLINAISON = -0.05; // le plan des orbites penche à peine
  const debut = performance.now();
  function placer(t) {
    const l = systeme.clientWidth, echelle = l / 1000;
    const taille = Math.max(30, l * 0.085);
    orbes.forEach((o, i) => {
      const orb = ORBITES[i % ORBITES.length];
      const periode = PERIODE * Math.pow(orb.rx / ORBITES[0].rx, 1.5);
      const a = orb.phase + (calme ? 0 : ((t - debut) / 1000) * (2 * Math.PI / periode));
      const ex = orb.rx * Math.cos(a), ey = orb.ry * Math.sin(a);
      const x = CX + ex * Math.cos(INCLINAISON) - ey * Math.sin(INCLINAISON);
      const y = CY + ex * Math.sin(INCLINAISON) + ey * Math.cos(INCLINAISON);
      const devant = Math.sin(a); // -1 tout au fond, 1 tout devant
      const s = 0.72 + 0.34 * (devant + 1) / 2;
      o.style.width = o.style.height = `${taille}px`;
      o.style.margin = `${-taille / 2}px 0 0 ${-taille / 2}px`;
      o.style.transform = `translate(${x * echelle}px, ${y * echelle}px) scale(${s.toFixed(3)})`;
      o.style.zIndex = devant > 0 ? "4" : "1";
      o.style.filter = `brightness(${(0.62 + 0.42 * (devant + 1) / 2).toFixed(3)})`;
    });
    if (!calme) requestAnimationFrame(placer);
  }
  requestAnimationFrame(placer);
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
  // Trois vraies questions publiées dans le jeu, choisies parce qu'elles ont
  // leur image : la démo doit ressembler au jeu. Les explications reprennent mot
  // pour mot une phrase de la banque — on ne reformule pas un fait.
  const QUESTIONS = [
    { monde: "Peinture", planete: "arts-visuels", enonce: "Qui a peint « La Jeune Fille à la perle » ?",
      juste: "Johannes Vermeer", faux: ["Rembrandt", "Frans Hals", "Pieter de Hooch"],
      image: "demo-vermeer", credit: "Johannes Vermeer, vers 1665 · domaine public",
      explication: "Oublié pendant près de deux siècles, le tableau ressurgit en 1881 dans une vente publique à La Haye, où un collectionneur l'emporta pour à peine deux florins." },
    { monde: "Géographie", planete: "geographie-monde", enonce: "Dans quel pays se trouve le Machu Picchu ?",
      juste: "Pérou", faux: ["Bolivie", "Équateur", "Colombie"],
      image: "demo-machu", credit: "Photo Martin St-Amant · CC BY-SA 3.0", lien: "https://commons.wikimedia.org/wiki/File:80_-_Machu_Picchu_-_Juin_2009_-_edit.jpg",
      explication: "Bâti vers 1450 pour l'empereur inca Pachacútec, à plus de 2 400 mètres d'altitude, le site reste inconnu du monde occidental jusqu'en 1911." },
    { monde: "Jeux vidéo", planete: "culture-populaire", enonce: "En quelle année sort la Game Boy au Japon ?",
      juste: "1989", faux: ["1985", "1992", "1995"],
      image: "demo-gameboy", credit: "Photo Evan-Amos · domaine public",
      explication: "Sa console tient sur 4 piles AA, théoriquement au moins dix heures." },
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
    $(".monde-q").innerHTML = `<img src="images/planete-${q.planete}.webp" alt="">${q.monde}`;
    const tuile = $(".tuile");
    tuile.querySelector("img").src = `images/${q.image}.webp`;
    tuile.querySelector("img").alt = "";
    const credit = tuile.querySelector(".credit");
    credit.textContent = q.credit;
    if (q.lien) credit.href = q.lien; else credit.removeAttribute("href");
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
      ? "Sans faute. Il y en a des milliers dans le jeu."
      : `${justes} sur ${QUESTIONS.length}. Il y en a des milliers dans le jeu pour progresser.`;
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
