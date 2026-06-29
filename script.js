// Dynamic year in footer
document.addEventListener("DOMContentLoaded", function () {
  var copy = document.getElementById("footer-copy");
  if (copy) {
    copy.textContent = "© " + new Date().getFullYear() + " DocMaster AI · Conformidade documental para a América Latina";
  }

  // Smooth scroll with fixed-nav offset for in-page anchors
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.pageYOffset - 72;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });
});