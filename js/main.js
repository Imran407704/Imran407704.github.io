/* =========================================================
   Imran Shaikh — portfolio
   Vanilla JS. No dependencies, no trackers.
   ========================================================= */

(function () {
  "use strict";

  document.documentElement.classList.add("js-ready");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Scroll progress ---------- */
  var progressBar = document.getElementById("scroll-progress-bar");
  if (progressBar) {
    var updateProgress = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? doc.scrollTop / max : 0;
      progressBar.style.width = (ratio * 100).toFixed(2) + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  /* ---------- Reveal on scroll ---------- */
  var revealItems = document.querySelectorAll("[data-reveal]");
  if (revealItems.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );
      revealItems.forEach(function (el) {
        revealObserver.observe(el);
      });
    }
  }

  /* ---------- Tagline word reveal ---------- */
  var tagline = document.querySelector("[data-reveal-words]");
  if (tagline) {
    var words = tagline.textContent.trim().split(/\s+/);
    tagline.textContent = "";
    words.forEach(function (word, index) {
      var span = document.createElement("span");
      span.textContent = word;
      span.style.setProperty("--i", String(index));
      tagline.appendChild(span);
      if (index < words.length - 1) tagline.appendChild(document.createTextNode(" "));
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      tagline.classList.add("is-visible");
    } else {
      var taglineObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              tagline.classList.add("is-visible");
              taglineObserver.unobserve(tagline);
            }
          });
        },
        { threshold: 0.4 }
      );
      taglineObserver.observe(tagline);
    }
  }

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = navLinks
    .map(function (link) {
      return document.getElementById(link.getAttribute("data-nav"));
    })
    .filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            link.classList.toggle(
              "is-active",
              link.getAttribute("data-nav") === entry.target.id
            );
          });
        });
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });

    var hero = document.getElementById("top");
    if (hero) {
      var heroObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              navLinks.forEach(function (link) {
                link.classList.remove("is-active");
              });
            }
          });
        },
        { rootMargin: "-42% 0px -52% 0px", threshold: 0 }
      );
      heroObserver.observe(hero);
    }
  }

  /* ---------- Command menu ---------- */
  var dialog = document.getElementById("command-menu");
  if (dialog && typeof dialog.showModal === "function") {
    var input = document.getElementById("cmd-input");
    var list = document.getElementById("cmd-list");
    var empty = document.getElementById("cmd-empty");
    var items = list ? Array.prototype.slice.call(list.querySelectorAll("a")) : [];
    var activeIndex = -1;
    var previousFocus = null;

    var visibleItems = function () {
      return items.filter(function (item) {
        return !item.parentElement.hidden;
      });
    };

    var setActive = function (index) {
      var available = visibleItems();
      items.forEach(function (item) {
        item.classList.remove("is-active");
      });
      if (!available.length) {
        activeIndex = -1;
        return;
      }
      activeIndex = (index + available.length) % available.length;
      available[activeIndex].classList.add("is-active");
    };

    var filter = function (query) {
      var q = query.trim().toLowerCase();
      var shown = 0;

      items.forEach(function (item) {
        var haystack = (
          item.textContent + " " + (item.getAttribute("data-keywords") || "")
        ).toLowerCase();
        var match = !q || haystack.indexOf(q) !== -1;
        item.parentElement.hidden = !match;
        if (match) shown += 1;
      });

      if (empty) empty.hidden = shown !== 0;
      activeIndex = -1;
      items.forEach(function (item) {
        item.classList.remove("is-active");
      });
      if (q && shown) setActive(0);
    };

    var openMenu = function () {
      previousFocus = document.activeElement;
      if (!dialog.open) dialog.showModal();
      document.body.classList.add("menu-open");
      if (input) {
        input.value = "";
        filter("");
      }
      window.setTimeout(function () {
        if (input) input.focus();
      }, 40);
    };

    var closeMenu = function () {
      if (dialog.open) dialog.close();
    };

    document.querySelectorAll("[data-cmd-open]").forEach(function (trigger) {
      trigger.addEventListener("click", openMenu);
    });

    document.querySelectorAll("[data-cmd-close]").forEach(function (button) {
      button.addEventListener("click", closeMenu);
    });

    dialog.addEventListener("close", function () {
      document.body.classList.remove("menu-open");
      if (previousFocus && typeof previousFocus.focus === "function") {
        previousFocus.focus();
      }
    });

    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) closeMenu();
    });

    if (input) {
      input.addEventListener("input", function () {
        filter(input.value);
      });

      input.addEventListener("keydown", function (event) {
        var available = visibleItems();
        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(activeIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(activeIndex - 1);
        } else if (event.key === "Enter") {
          event.preventDefault();
          var target = available[activeIndex] || available[0];
          if (target) {
            if (target.target === "_blank") {
              window.open(target.href, "_blank", "noopener,noreferrer");
            } else {
              closeMenu();
              window.location.hash = target.getAttribute("href");
            }
          }
        }
      });
    }

    items.forEach(function (item) {
      item.addEventListener("click", function (event) {
        var href = item.getAttribute("href") || "";
        if (href.charAt(0) === "#" && !item.target) {
          event.preventDefault();
          closeMenu();
          window.location.hash = href;
        } else if (!item.target) {
          closeMenu();
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      var key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        if (dialog.open) closeMenu();
        else openMenu();
      }
    });
  }

  /* ---------- Hero rain ---------- */
  var canvas = document.getElementById("rain");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var glyphs = "01ABCDEF{}[]<>/\\$#*+=;:".split("");
    var columns = [];
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var lastFrame = 0;
    var frameInterval = 1000 / 24;

    var resize = function () {
      var rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var columnCount = Math.ceil(width / 26);
      columns = [];
      for (var i = 0; i < columnCount; i += 1) {
        columns.push({
          x: i * 26 + 13,
          y: Math.random() * height,
          speed: 14 + Math.random() * 28,
          glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
          alpha: 0.05 + Math.random() * 0.12
        });
      }
    };

    var draw = function (time) {
      if (document.hidden) {
        window.requestAnimationFrame(draw);
        return;
      }

      if (time - lastFrame < frameInterval) {
        window.requestAnimationFrame(draw);
        return;
      }
      lastFrame = time;

      ctx.clearRect(0, 0, width, height);
      ctx.font = '12px ui-monospace, "SFMono-Regular", Menlo, monospace';
      ctx.textAlign = "center";

      columns.forEach(function (drop) {
        ctx.fillStyle = "rgba(0, 255, 156, " + drop.alpha + ")";
        ctx.fillText(drop.glyph, drop.x, drop.y);
        drop.y += drop.speed * 0.05;
        if (drop.y > height + 20) {
          drop.y = -20;
          drop.glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        }
        if (Math.random() < 0.006) {
          drop.glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
        }
      });

      window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.requestAnimationFrame(draw);
  }
})();
