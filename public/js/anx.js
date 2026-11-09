document.addEventListener("DOMContentLoaded", function () {
  const docButton = document.querySelector("documentation-button") ?? null;
  const gameButton = document.querySelector("game-button") ?? null;

  let uid = JSON.parse(window.sessionStorage.getItem("wh-uid")) ?? null;

  if (docButton)
    docButton.addEventListener("click", () => {
      docButton.focus();
      window.open("./doc.html", { target: "_blank" });
      console.info("Redirection vers la doc.");
    });
  if (gameButton)
    gameButton.addEventListener("click", () => {
      gameButton.focus();
      window.open("./index.html", { target: "_blank" });
      console.info("Redirection vers le jeu.");
    });
  if (!uid) {
    uid = {
      id: Math.ceil(Date.now() + (Math.random() * 5 + Math.random() * 100) - 3),
    };
    window.sessionStorage.setItem("wh-uid", JSON.stringify(uid));
  }
});
