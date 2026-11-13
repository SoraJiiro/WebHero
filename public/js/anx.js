document.addEventListener("DOMContentLoaded", function () {
  const docButton = document.querySelector("#documentation-button");

  if (docButton)
    docButton.addEventListener("click", () => {
      docButton.focus();
      window.open("./doc.html", { target: "_blank" });
      console.info("Redirection vers la doc.");
    });
});
