// LA PAGE D'UNE SALLE — lit le code dans l'adresse (?c=A7F2K9), l'affiche, et
// ouvre l'application dans la salle. Le code n'est jamais envoyé nulle part :
// il ne fait que passer de l'adresse de la page au lien de l'application.
(function () {
  var brut = new URLSearchParams(location.search).get("c") || location.hash.replace(/^#/, "");
  var code = /^[A-Za-z0-9]{6}$/.test(brut || "") ? brut.toUpperCase() : null;
  var bloc = document.querySelector(".invitation");
  if (!code) { bloc.classList.add("sans-code"); return; }
  var lien = "pajordor://salle/" + code;
  document.querySelector(".code b").textContent = code;
  document.querySelector(".rejoindre").setAttribute("href", lien);
  document.title = "Rejoins la battle " + code + " — Cultivé";
  // Une tentative tout de suite : si l'application est là, iOS propose de
  // l'ouvrir. Sinon la page reste, avec le bouton et le chemin vers l'App Store.
  setTimeout(function () { location.href = lien; }, 350);
})();
