(() => {
  // <stdin>
  (() => {
    const root = document.documentElement;
    const themeButton = document.querySelector(".theme-toggle");
    const giscusPanel = document.querySelector("[data-giscus]");
    const preferredTheme = () => window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const themeModes = {
      dark: { color: "#0c1117", label: "\u5207\u6362\u5230\u62A4\u773C\u6A21\u5F0F" },
      eye: { color: "#e9e4d8", label: "\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F" },
      light: { color: "#f5f7fb", label: "\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F" }
    };
    const nextTheme = { dark: "eye", eye: "light", light: "dark" };
    const applyTheme = (theme, persist = true) => {
      const mode = themeModes[theme] ? theme : "dark";
      const modeConfig = themeModes[mode];
      root.dataset.theme = mode;
      document.querySelector('meta[name="theme-color"]')?.setAttribute(
        "content",
        modeConfig.color
      );
      themeButton?.setAttribute("aria-label", modeConfig.label);
      themeButton?.setAttribute("title", modeConfig.label);
      if (persist) {
        localStorage.setItem("wayline-theme", mode);
        localStorage.removeItem("ronggle-theme");
      }
      updateGiscusTheme();
    };
    applyTheme(root.dataset.theme || preferredTheme(), false);
    themeButton?.addEventListener("click", () => {
      applyTheme(nextTheme[root.dataset.theme] || "eye");
    });
    const navButton = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".site-nav");
    const navBackdrop = document.querySelector(".nav-backdrop");
    const closeNavigation = () => {
      navButton?.setAttribute("aria-expanded", "false");
      navigation?.classList.remove("is-open");
      navBackdrop?.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    };
    navButton?.addEventListener("click", () => {
      const open = navButton.getAttribute("aria-expanded") === "true";
      navButton.setAttribute("aria-expanded", String(!open));
      navigation?.classList.toggle("is-open", !open);
      navBackdrop?.classList.toggle("is-open", !open);
      document.body.classList.toggle("nav-open", !open);
    });
    navBackdrop?.addEventListener("click", closeNavigation);
    navigation?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeNavigation);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNavigation();
    });
    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          });
        },
        { rootMargin: "0px 0px -8%", threshold: 0.06 }
      );
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        revealObserver.observe(element);
      });
    } else {
      document.querySelectorAll("[data-reveal]").forEach((element) => {
        element.classList.add("is-visible");
      });
    }
    const progressBar = document.querySelector(".reading-progress span");
    if (progressBar) {
      const updateProgress = () => {
        const article = document.querySelector("[data-article-content]");
        if (!article) return;
        const start = article.offsetTop;
        const length = Math.max(article.offsetHeight - window.innerHeight * 0.55, 1);
        const value = Math.min(Math.max((window.scrollY - start) / length, 0), 1);
        progressBar.style.width = `${value * 100}%`;
      };
      updateProgress();
      window.addEventListener("scroll", updateProgress, { passive: true });
      window.addEventListener("resize", updateProgress);
    }
    const codeBlocks = document.querySelectorAll(".prose .highlight, .prose pre:not(.chroma)");
    codeBlocks.forEach((block) => {
      const code = block.querySelector("code");
      if (!code) return;
      const codeSurface = block.matches("pre") ? block : block.querySelector("pre");
      let language = null;
      if (block.classList.contains("highlight") && !block.querySelector(".code-language")) {
        language = document.createElement("span");
        language.className = "code-language";
        language.textContent = (code.dataset.lang || "CODE").toUpperCase();
        block.append(language);
      }
      if (language && codeSurface) {
        const updateOverflowLabel = () => {
          const baseLabel = (code.dataset.lang || "CODE").toUpperCase();
          language.textContent = codeSurface.scrollWidth > codeSurface.clientWidth + 1 ? `${baseLabel} \xB7 SWIPE \u2192` : baseLabel;
        };
        updateOverflowLabel();
        document.fonts?.ready.then(updateOverflowLabel);
        window.addEventListener("resize", updateOverflowLabel);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "COPY";
      block.append(button);
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(code.innerText);
          button.textContent = "COPIED";
        } catch {
          button.textContent = "FAILED";
        }
        window.setTimeout(() => {
          button.textContent = "COPY";
        }, 1600);
      });
    });
    document.querySelector("[data-print-resume]")?.addEventListener("click", () => {
      window.print();
    });
    const revealContact = (button) => {
      try {
        const value = atob(button.dataset.contact || "").trim();
        const link = document.createElement("a");
        link.href = button.dataset.contactType === "email" ? `mailto:${value}` : `tel:${value.replace(/\s+/g, "")}`;
        link.textContent = value;
        button.replaceWith(link);
      } catch {
        button.textContent = "\u8BF7\u66F4\u65B0\u8054\u7CFB\u65B9\u5F0F";
      }
    };
    document.querySelectorAll(".contact-reveal").forEach((button) => {
      button.addEventListener("click", () => revealContact(button));
    });
    window.addEventListener("beforeprint", () => {
      document.querySelectorAll(".contact-reveal").forEach(revealContact);
    });
    const tocLinks = [...document.querySelectorAll("[data-toc] a")];
    const tocHeadings = tocLinks.map((link) => {
      const id = decodeURIComponent(link.hash.slice(1));
      return { link, heading: document.getElementById(id) };
    }).filter((item) => item.heading);
    if (tocHeadings.length && "IntersectionObserver" in window) {
      const tocObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            tocLinks.forEach((link) => link.classList.remove("is-active"));
            tocHeadings.find((item) => item.heading === entry.target)?.link.classList.add("is-active");
          });
        },
        { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
      );
      tocHeadings.forEach((item) => tocObserver.observe(item.heading));
    }
    function updateGiscusTheme() {
      if (!giscusPanel) return;
      const frame = document.querySelector("iframe.giscus-frame");
      if (!frame) return;
      const theme = root.dataset.theme === "dark" ? giscusPanel.dataset.giscusDark || "dark_dimmed" : giscusPanel.dataset.giscusLight || "light";
      frame.contentWindow?.postMessage(
        { giscus: { setConfig: { theme } } },
        "https://giscus.app"
      );
    }
    if (giscusPanel) {
      window.addEventListener("message", (event) => {
        if (event.origin === "https://giscus.app") updateGiscusTheme();
      });
    }
    const worldDialog = document.querySelector("[data-world-dialog]");
    const worldOpenButtons = [...document.querySelectorAll("[data-world-open]")];
    const worldOpenButton = worldOpenButtons[0];
    const autoOpenWorld = worldDialog?.dataset.worldAutoOpen === "true";
    const worldIsHome = worldDialog?.dataset.worldHome === "true";
    if (worldDialog && (worldOpenButton || autoOpenWorld)) {
      const canvas = worldDialog.querySelector("[data-world-canvas]");
      const loading = worldDialog.querySelector("[data-world-loading]");
      const loadProgress = worldDialog.querySelector("[data-world-load-progress]");
      const worldDataUrl = worldDialog.dataset.worldDataUrl;
      const sectionButtons = [...worldDialog.querySelectorAll("[data-world-section]")];
      const intro = worldDialog.querySelector("[data-world-intro]");
      const detail = worldDialog.querySelector("[data-world-detail]");
      const mission = worldDialog.querySelector("[data-world-mission]");
      const missionLabel = worldDialog.querySelector("[data-world-mission-label]");
      const progressText = worldDialog.querySelector("[data-world-progress-text]");
      const progressBar2 = worldDialog.querySelector("[data-world-progress-bar]");
      const speedometer = worldDialog.querySelector(".world-speedometer");
      const speedValue = worldDialog.querySelector("[data-world-speed]");
      const discovery = worldDialog.querySelector("[data-world-discovery]");
      const discoveryTitle = worldDialog.querySelector("[data-world-discovery-title]");
      const detailDate = worldDialog.querySelector("[data-world-detail-date]");
      const detailTitle = worldDialog.querySelector("[data-world-detail-title]");
      const detailSubtitle = worldDialog.querySelector("[data-world-detail-subtitle]");
      const detailDescription = worldDialog.querySelector("[data-world-detail-description]");
      const detailRead = worldDialog.querySelector("[data-world-read]");
      const detailPosition = worldDialog.querySelector("[data-world-position]");
      const reader = worldDialog.querySelector("[data-world-reader]");
      const readerMeta = worldDialog.querySelector("[data-world-reader-meta]");
      const readerTitle = worldDialog.querySelector("[data-world-reader-title]");
      const readerContent = worldDialog.querySelector("[data-world-reader-content]");
      const readerProgress = worldDialog.querySelector("[data-world-reader-progress]");
      const readerPercent = worldDialog.querySelector("[data-world-reader-percent]");
      const readerFinish = worldDialog.querySelector("[data-world-finish]");
      const reward = worldDialog.querySelector("[data-world-reward]");
      const rewardCopy = worldDialog.querySelector("[data-world-reward-copy]");
      const rewardBadges = worldDialog.querySelector("[data-world-reward-badges]");
      const rewardCount = worldDialog.querySelector("[data-world-reward-count]");
      const badgeCounter = worldDialog.querySelector("[data-world-badges]");
      const stepButtons = [...worldDialog.querySelectorAll("[data-world-step]")];
      let requestedSection = worldDialog.dataset.worldInitial || "overview";
      let worldController = null;
      let worldImport = null;
      let worldDataPromise = null;
      let currentWorldItem = null;
      let discoveryTimer = null;
      let readerCloseTimer = null;
      const readBadgeCollection = () => {
        try {
          const value = JSON.parse(localStorage.getItem("wayline-article-badges") || "[]");
          return Array.isArray(value) ? value : [];
        } catch {
          return [];
        }
      };
      let badgeCollection = readBadgeCollection();
      const updateBadgeCounter = () => {
        badgeCounter.textContent = String(badgeCollection.length).padStart(2, "0");
      };
      updateBadgeCounter();
      const missionLabels = {
        archive: "\u6CBF\u5F52\u6863\u65F6\u95F4\u7EBF\u63A2\u7D22\u6587\u7AE0",
        about: "\u4ECE\u6559\u80B2\u80CC\u666F\u9A76\u5411\u5F53\u524D\u5C65\u5386",
        gallery: "\u53D1\u73B0\u5F71\u50CF\u6863\u6848\u4E2D\u7684\u65F6\u95F4\u8282\u70B9"
      };
      const updateWorldUi = (payload) => {
        const mode = payload?.mode || "overview";
        sectionButtons.forEach((button) => {
          button.setAttribute("aria-pressed", String(button.dataset.worldSection === mode));
        });
        intro.hidden = Boolean(payload);
        detail.hidden = !payload;
        mission.hidden = !payload;
        if (discovery) discovery.classList.remove("is-visible");
        if (!payload) {
          return;
        }
        missionLabel.textContent = missionLabels[mode] || "\u63A2\u7D22\u65F6\u95F4\u7EBF";
        progressText.textContent = `${String(payload.index + 1).padStart(2, "0")} / ${String(payload.total).padStart(2, "0")}`;
        progressBar2.style.width = `${(payload.index + 1) / Math.max(payload.total, 1) * 100}%`;
        detailDate.textContent = payload.item.date || "";
        detailTitle.textContent = payload.item.title || "";
        detailSubtitle.textContent = payload.item.subtitle || "";
        detailSubtitle.hidden = !payload.item.subtitle;
        detailDescription.textContent = payload.item.description || "";
        detailDescription.hidden = !payload.item.description;
        detailPosition.textContent = `${String(payload.index + 1).padStart(2, "0")} / ${String(payload.total).padStart(2, "0")}`;
        currentWorldItem = payload.item;
      };
      const showDiscovery = ({ item }) => {
        if (!discovery || !discoveryTitle) return;
        window.clearTimeout(discoveryTimer);
        discoveryTitle.textContent = item.title || "\u65B0\u7684\u65F6\u95F4\u8282\u70B9";
        discovery.hidden = false;
        requestAnimationFrame(() => discovery.classList.add("is-visible"));
        discoveryTimer = window.setTimeout(() => {
          discovery.classList.remove("is-visible");
          window.setTimeout(() => {
            discovery.hidden = true;
          }, 220);
        }, 1800);
      };
      const updateDrive = ({ speed, boost }) => {
        speedValue.textContent = String(speed).padStart(2, "0");
        speedometer.dataset.boost = String(boost);
      };
      const closeReader = () => {
        if (!reader || reader.hidden) return;
        window.clearTimeout(readerCloseTimer);
        reader.classList.remove("is-visible");
        if (reward) {
          reward.classList.remove("is-visible");
          reward.hidden = true;
        }
        worldController?.setInteractionEnabled(true);
        readerCloseTimer = window.setTimeout(() => {
          reader.hidden = true;
          readerContent.scrollTop = 0;
          canvas.focus();
        }, 220);
      };
      const openReader = () => {
        if (!reader || !currentWorldItem) return;
        window.clearTimeout(readerCloseTimer);
        readerCloseTimer = null;
        readerMeta.textContent = `${currentWorldItem.date || ""}${currentWorldItem.subtitle ? ` \xB7 ${currentWorldItem.subtitle}` : ""}`;
        readerTitle.textContent = currentWorldItem.title || "\u672A\u547D\u540D\u5185\u5BB9";
        readerContent.innerHTML = currentWorldItem.html || `<p>${currentWorldItem.description || ""}</p>`;
        if (readerProgress) readerProgress.style.width = "0%";
        if (readerPercent) readerPercent.textContent = "00%";
        if (readerFinish) readerFinish.disabled = true;
        if (reward) {
          reward.hidden = true;
          reward.classList.remove("is-visible");
        }
        reader.hidden = false;
        worldController?.setInteractionEnabled(false);
        const resetReaderProgress = () => {
          readerContent.scrollTop = 0;
          updateReaderProgress();
        };
        resetReaderProgress();
        requestAnimationFrame(() => {
          reader.classList.add("is-visible");
          resetReaderProgress();
          requestAnimationFrame(resetReaderProgress);
          readerContent.querySelectorAll("img").forEach((image) => {
            image.addEventListener("load", updateReaderProgress, { once: true });
          });
          reader.querySelector("[data-world-reader-close]")?.focus();
        });
      };
      const updateReaderProgress = () => {
        const maxScroll = readerContent.scrollHeight - readerContent.clientHeight;
        const progress = maxScroll <= 4 ? 100 : Math.min(100, Math.max(0, readerContent.scrollTop / maxScroll * 100));
        readerProgress.style.width = `${progress}%`;
        readerPercent.textContent = `${String(Math.round(progress)).padStart(2, "0")}%`;
        readerFinish.disabled = progress < 82;
      };
      const badgeColor = (value) => {
        const colors = ["#24786f", "#536bd4", "#92721c", "#a84f6d", "#5f7142"];
        let hash = 0;
        [...value].forEach((character) => {
          hash = hash * 31 + character.charCodeAt(0) >>> 0;
        });
        return colors[hash % colors.length];
      };
      const showReward = () => {
        if (!reward || reward.hidden === false) return;
        const existing = new Set(badgeCollection);
        const tags = currentWorldItem?.tags?.length ? currentWorldItem.tags : [currentWorldItem?.subtitle || "WAYLINE"];
        const newTags = tags.filter((tag) => !existing.has(tag));
        tags.forEach((tag) => existing.add(tag));
        badgeCollection = [...existing];
        localStorage.setItem("wayline-article-badges", JSON.stringify(badgeCollection));
        updateBadgeCounter();
        rewardBadges.replaceChildren();
        tags.forEach((tag, index) => {
          const badge = document.createElement("span");
          badge.className = "reward-badge is-new";
          badge.style.setProperty("--badge-color", badgeColor(`${tag}-${index}`));
          const mark = document.createElement("i");
          mark.textContent = String(index + 1).padStart(2, "0");
          const label = document.createElement("strong");
          label.textContent = tag;
          badge.append(mark, label);
          rewardBadges.append(badge);
        });
        rewardCount.textContent = String(badgeCollection.length).padStart(2, "0");
        rewardCopy.textContent = newTags.length ? `\u53D1\u73B0 ${newTags.length} \u679A\u65B0\u5FBD\u7AE0\uFF0C\u6587\u7AE0\u6807\u7B7E\u5DF2\u7ECF\u5B58\u5165\u4F60\u7684\u63A2\u7D22\u6536\u85CF\u3002` : "\u8FD9\u4E9B\u5FBD\u7AE0\u5DF2\u7ECF\u5728\u6536\u85CF\u4E2D\uFF0C\u7EE7\u7EED\u6CBF\u9053\u8DEF\u63A2\u7D22\u65B0\u7684\u4FE1\u53F7\u3002";
        reward.hidden = false;
        requestAnimationFrame(() => reward.classList.add("is-visible"));
      };
      readerContent.addEventListener("scroll", updateReaderProgress, { passive: true });
      readerFinish?.addEventListener("click", showReward);
      worldDialog.querySelector("[data-world-reward-continue]")?.addEventListener("click", () => {
        reward.classList.remove("is-visible");
        window.setTimeout(closeReader, 180);
      });
      const setWorldSection = (mode) => {
        requestedSection = mode;
        if (worldController) {
          worldController.setMode(mode);
        }
      };
      const updateLoadProgress = (value, label) => {
        if (loadProgress) loadProgress.style.width = `${value}%`;
        const status = loading?.querySelector("small");
        if (status && label) status.textContent = label;
      };
      const openWorld = async () => {
        if (worldDialog.open) return;
        worldDialog.showModal();
        document.body.classList.add("world-open");
        worldOpenButtons.forEach((button) => button.setAttribute("aria-expanded", "true"));
        if (worldController) {
          loading?.classList.add("is-hidden");
          worldController.resume();
          canvas.focus();
          return;
        }
        loading?.classList.remove("is-hidden");
        updateLoadProgress(8, "\u6B63\u5728\u8FDB\u5165 3D \u4E16\u754C");
        try {
          worldImport ||= import(worldDialog.dataset.worldScript);
          updateLoadProgress(28, "\u6B63\u5728\u521D\u59CB\u5316\u6E32\u67D3\u5668");
          const { createWorld } = await worldImport;
          updateLoadProgress(42, "\u6B63\u5728\u8BFB\u53D6\u65F6\u95F4\u7EBF");
          worldDataPromise ||= fetch(worldDataUrl, { cache: "no-cache" }).then((response) => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
          });
          const worldData = await worldDataPromise;
          updateLoadProgress(72, "\u6B63\u5728\u6784\u5EFA\u8BBE\u8BA1\u5730\u56FE");
          worldController = createWorld({
            canvas,
            data: worldData,
            carUrl: worldDialog.dataset.worldCarUrl,
            treeUrl: worldDialog.dataset.worldTreeUrl,
            skyUrl: worldDialog.dataset.worldSkyUrl,
            onTimelineChange: updateWorldUi,
            onDiscovery: showDiscovery,
            onDrive: updateDrive,
            onInteract: openReader,
            onReady: () => {
              updateLoadProgress(100, "\u4E16\u754C\u51C6\u5907\u5B8C\u6210");
              window.setTimeout(() => {
                loading?.classList.add("is-hidden");
                canvas.focus();
              }, 220);
            }
          });
          updateLoadProgress(90, "\u6B63\u5728\u6821\u51C6\u4FE1\u53F7");
          worldController.setMode(requestedSection);
        } catch {
          worldImport = null;
          worldDataPromise = null;
          updateLoadProgress(0, "\u65E0\u6CD5\u52A0\u8F7D 3D \u573A\u666F\uFF0C\u8BF7\u68C0\u67E5\u6D4F\u89C8\u5668 WebGL \u652F\u6301");
        }
      };
      const closeWorld = () => {
        if (worldIsHome) return;
        if (worldDialog.open) worldDialog.close();
      };
      worldOpenButtons.forEach((button) => {
        button.setAttribute("aria-expanded", "false");
        button.addEventListener("click", openWorld);
      });
      sectionButtons.forEach((button) => {
        button.addEventListener("click", () => setWorldSection(button.dataset.worldSection));
      });
      stepButtons.forEach((button) => {
        button.addEventListener("click", () => {
          worldController?.step(Number(button.dataset.worldStep));
        });
      });
      detailRead?.addEventListener("click", openReader);
      worldDialog.querySelectorAll("[data-world-reader-close]").forEach((button) => {
        button.addEventListener("click", closeReader);
      });
      document.addEventListener("keydown", (event) => {
        if (reader && !reader.hidden && (event.key === "Escape" || event.code === "KeyQ")) {
          event.preventDefault();
          event.stopPropagation();
          closeReader();
        }
      }, true);
      worldDialog.querySelector("[data-world-close]")?.addEventListener("click", closeWorld);
      worldDialog.addEventListener("cancel", (event) => {
        if (reader && !reader.hidden) {
          event.preventDefault();
          closeReader();
        } else if (worldIsHome) {
          event.preventDefault();
        }
      });
      worldDialog.addEventListener("click", (event) => {
        if (event.target === worldDialog) closeWorld();
      });
      worldDialog.addEventListener("close", () => {
        document.body.classList.remove("world-open");
        worldOpenButtons.forEach((button) => button.setAttribute("aria-expanded", "false"));
        worldController?.pause();
      });
      if (autoOpenWorld) {
        requestAnimationFrame(openWorld);
      }
    }
    const photoItems = [...document.querySelectorAll("[data-photo-item]")];
    const photoLightbox = document.querySelector("#photo-lightbox");
    if (photoItems.length && photoLightbox) {
      let activePhoto = 0;
      const image = photoLightbox.querySelector("[data-lightbox-image]");
      const title = photoLightbox.querySelector("[data-lightbox-title]");
      const meta = photoLightbox.querySelector("[data-lightbox-meta]");
      const description = photoLightbox.querySelector("[data-lightbox-description]");
      const credit = photoLightbox.querySelector("[data-lightbox-credit]");
      const license = photoLightbox.querySelector("[data-lightbox-license]");
      const link = photoLightbox.querySelector("[data-lightbox-link]");
      const counter = photoLightbox.querySelector("[data-lightbox-counter]");
      const previous = photoLightbox.querySelector("[data-lightbox-prev]");
      const next = photoLightbox.querySelector("[data-lightbox-next]");
      const updatePhoto = (index) => {
        activePhoto = (index + photoItems.length) % photoItems.length;
        const item = photoItems[activePhoto];
        image.src = item.dataset.photoSrc;
        image.alt = item.dataset.photoTitle || "";
        title.textContent = item.dataset.photoTitle || "";
        meta.textContent = item.dataset.photoMeta || "";
        description.textContent = item.dataset.photoDescription || "";
        description.hidden = !item.dataset.photoDescription;
        credit.textContent = item.dataset.photoCredit ? `PHOTO \xB7 ${item.dataset.photoCredit}` : "";
        credit.hidden = !item.dataset.photoCredit;
        license.textContent = item.dataset.photoLicense || "";
        license.href = item.dataset.photoLicenseUrl || "#";
        license.hidden = !(item.dataset.photoLicense && item.dataset.photoLicenseUrl);
        link.href = item.dataset.photoLink || "#";
        link.hidden = !item.dataset.photoLink;
        link.target = /^https?:\/\//.test(item.dataset.photoLink || "") ? "_blank" : "";
        link.rel = link.target ? "noopener noreferrer" : "";
        link.textContent = item.dataset.photoLinkLabel || "\u67E5\u770B\u76F8\u5173\u9875\u9762 \u2197";
        counter.textContent = `${String(activePhoto + 1).padStart(2, "0")} / ${String(photoItems.length).padStart(2, "0")}`;
      };
      const openPhoto = (index) => {
        updatePhoto(index);
        photoLightbox.showModal();
        document.body.classList.add("photo-open");
        photoLightbox.querySelector("[data-lightbox-close]").focus();
      };
      const closePhoto = () => {
        if (photoLightbox.open) photoLightbox.close();
      };
      const galleryGrid = document.querySelector("[data-gallery-grid]");
      const photoStage = document.querySelector("[data-photo-stage]");
      const viewSwitch = document.querySelector("[data-gallery-view-switch]");
      if (galleryGrid && photoStage && viewSwitch) {
        const track = photoStage.querySelector("[data-photo-stage-track]");
        const counter2 = photoStage.querySelector("[data-stage-counter]");
        const previousStage = photoStage.querySelector("[data-stage-prev]");
        const nextStage = photoStage.querySelector("[data-stage-next]");
        const viewport = photoStage.querySelector("[data-photo-stage-viewport]");
        const modeButtons = [...viewSwitch.querySelectorAll("[data-gallery-mode]")];
        let stageIndex = 0;
        let dragging = false;
        let dragStart = 0;
        let suppressStageClick = false;
        const stageCards = photoItems.map((item, index) => {
          const source = item.querySelector("img");
          const card = document.createElement("button");
          card.type = "button";
          card.className = "photo-stage__card";
          card.setAttribute("aria-label", `\u67E5\u770B\u56FE\u7247\uFF1A${item.dataset.photoTitle}`);
          const image2 = document.createElement("img");
          image2.src = source?.currentSrc || source?.src || item.dataset.photoSrc;
          image2.alt = item.dataset.photoTitle || "";
          image2.decoding = "async";
          const caption = document.createElement("figcaption");
          const meta2 = document.createElement("span");
          const title2 = document.createElement("strong");
          meta2.textContent = item.dataset.photoMeta || "";
          title2.textContent = item.dataset.photoTitle || "";
          caption.append(meta2, title2);
          card.append(image2, caption);
          card.addEventListener("click", () => {
            if (suppressStageClick) return;
            if (index === stageIndex) {
              openPhoto(index);
              return;
            }
            stageIndex = index;
            renderStage();
          });
          track.append(card);
          return card;
        });
        const renderStage = () => {
          const count = stageCards.length;
          stageCards.forEach((card, index) => {
            let offset = index - stageIndex;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;
            const distance = Math.abs(offset);
            const scale = Math.max(0.62, 1 - distance * 0.1);
            const visible = distance <= 3;
            card.style.transform = `translate(-50%, -50%) translateX(${offset * 48}%) translateZ(${-distance * 150}px) rotateY(${-offset * 38}deg) scale(${scale})`;
            card.style.opacity = visible ? String(Math.max(0.28, 1 - distance * 0.19)) : "0";
            card.style.zIndex = String(100 - distance);
            card.style.pointerEvents = visible ? "auto" : "none";
            card.classList.toggle("is-active", offset === 0);
            card.tabIndex = offset === 0 ? 0 : -1;
            card.setAttribute("aria-hidden", String(!visible));
          });
          counter2.textContent = `${String(stageIndex + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
        };
        const setGalleryMode = (mode, persist = true) => {
          const in3d = mode === "3d";
          galleryGrid.hidden = in3d;
          photoStage.hidden = !in3d;
          viewSwitch.hidden = false;
          modeButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.galleryMode === mode));
          });
          if (in3d) renderStage();
          if (persist) localStorage.setItem("wayline-gallery-mode", mode);
        };
        modeButtons.forEach((button) => {
          button.addEventListener("click", () => setGalleryMode(button.dataset.galleryMode));
        });
        previousStage?.addEventListener("click", () => {
          stageIndex = (stageIndex - 1 + stageCards.length) % stageCards.length;
          renderStage();
        });
        nextStage?.addEventListener("click", () => {
          stageIndex = (stageIndex + 1) % stageCards.length;
          renderStage();
        });
        viewport?.addEventListener("pointerdown", (event) => {
          dragging = true;
          dragStart = event.clientX;
          viewport.setPointerCapture(event.pointerId);
        });
        viewport?.addEventListener("pointerup", (event) => {
          if (!dragging) return;
          dragging = false;
          const distance = event.clientX - dragStart;
          if (Math.abs(distance) < 38) return;
          suppressStageClick = true;
          stageIndex = (stageIndex + (distance < 0 ? 1 : -1) + stageCards.length) % stageCards.length;
          renderStage();
          window.setTimeout(() => {
            suppressStageClick = false;
          }, 0);
        });
        viewport?.addEventListener("pointercancel", () => {
          dragging = false;
        });
        document.addEventListener("keydown", (event) => {
          if (photoLightbox.open || photoStage.hidden || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) {
            return;
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            stageIndex = (stageIndex - 1 + stageCards.length) % stageCards.length;
            renderStage();
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            stageIndex = (stageIndex + 1) % stageCards.length;
            renderStage();
          }
        });
        renderStage();
        const savedMode = localStorage.getItem("wayline-gallery-mode");
        setGalleryMode(savedMode === "3d" ? "3d" : "grid", false);
      }
      photoItems.forEach((item, index) => {
        item.addEventListener("click", () => openPhoto(index));
      });
      photoLightbox.querySelector("[data-lightbox-close]")?.addEventListener("click", closePhoto);
      previous?.addEventListener("click", () => updatePhoto(activePhoto - 1));
      next?.addEventListener("click", () => updatePhoto(activePhoto + 1));
      photoLightbox.addEventListener("click", (event) => {
        if (event.target === photoLightbox) closePhoto();
      });
      photoLightbox.addEventListener("close", () => {
        document.body.classList.remove("photo-open");
      });
      document.addEventListener("keydown", (event) => {
        if (!photoLightbox.open) return;
        if (event.key === "Escape") {
          event.preventDefault();
          closePhoto();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          updatePhoto(activePhoto - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          updatePhoto(activePhoto + 1);
        }
      });
      if (photoItems.length === 1) {
        previous?.setAttribute("hidden", "");
        next?.setAttribute("hidden", "");
      }
    }
    const escapeHTML = (value = "") => String(value).replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
    const createSearchController = ({
      form,
      input,
      results,
      status,
      endpoint,
      limit = 30,
      idleText = "",
      syncUrl = false
    }) => {
      let documents = [];
      let indexState = "idle";
      let timer;
      const render = (query) => {
        const normalized = query.trim().toLocaleLowerCase();
        results.replaceChildren();
        if (!normalized) {
          status.textContent = idleText || `INDEX READY / ${documents.length} ENTRIES`;
          return;
        }
        const matches = documents.filter((entry) => {
          const haystack = [
            entry.title,
            entry.summary,
            ...entry.categories || [],
            ...entry.tags || []
          ].join(" ").toLocaleLowerCase();
          return haystack.includes(normalized);
        }).slice(0, limit);
        status.textContent = `${matches.length} RESULT${matches.length === 1 ? "" : "S"} / \u201C${query.trim()}\u201D`;
        if (!matches.length) {
          const empty = document.createElement("p");
          empty.className = "search-empty";
          empty.textContent = "\u6CA1\u6709\u5339\u914D\u5185\u5BB9\u3002\u6362\u4E00\u4E2A\u5173\u952E\u8BCD\u8BD5\u8BD5\u3002";
          results.append(empty);
          return;
        }
        matches.forEach((entry) => {
          const link = document.createElement("a");
          link.className = "search-result";
          link.href = entry.permalink;
          link.innerHTML = `
                    <time>${escapeHTML(entry.date)}</time>
                    <div>
                        <h2>${escapeHTML(entry.title)}</h2>
                        <p>${escapeHTML(entry.summary)}</p>
                    </div>
                    <span class="search-result__arrow">\u2197</span>
                `;
          results.append(link);
        });
      };
      const loadIndex = async () => {
        if (indexState === "loaded" || indexState === "loading" || !endpoint) return;
        indexState = "loading";
        status.textContent = "LOADING INDEX / \u6B63\u5728\u8BFB\u53D6\u6587\u7AE0\u7D22\u5F15";
        try {
          const response = await fetch(endpoint, { cache: "force-cache" });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          documents = await response.json();
          indexState = "loaded";
          render(input.value);
        } catch {
          indexState = "error";
          status.textContent = "INDEX UNAVAILABLE / \u641C\u7D22\u7D22\u5F15\u6682\u65F6\u65E0\u6CD5\u52A0\u8F7D";
        }
      };
      input.addEventListener("input", () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          render(input.value);
          if (syncUrl) {
            const url = new URL(window.location.href);
            input.value.trim() ? url.searchParams.set("q", input.value.trim()) : url.searchParams.delete("q");
            history.replaceState({}, "", url);
          }
        }, 100);
      });
      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        loadIndex();
        render(input.value);
      });
      return { loadIndex, focus: () => input.focus() };
    };
    const searchPage = document.querySelector("[data-search-page]");
    let pageSearch = null;
    if (searchPage) {
      const input = searchPage.querySelector("#search-input");
      input.value = new URL(window.location.href).searchParams.get("q") || "";
      pageSearch = createSearchController({
        form: searchPage.querySelector(".js-search-form"),
        input,
        results: searchPage.querySelector(".search-results"),
        status: searchPage.querySelector(".search-status"),
        endpoint: searchPage.dataset.searchJson,
        syncUrl: true
      });
      pageSearch.loadIndex();
    }
    const searchDialog = document.querySelector("#site-search-dialog");
    const searchOpenButton = document.querySelector("[data-search-open]");
    if (searchDialog && searchOpenButton) {
      const input = searchDialog.querySelector("[data-search-dialog-input]");
      const indexUrl = searchDialog.querySelector("[data-search-index-url]")?.dataset.searchIndexUrl;
      const dialogSearch = createSearchController({
        form: searchDialog.querySelector(".site-search__form"),
        input,
        results: searchDialog.querySelector("[data-search-dialog-results]"),
        status: searchDialog.querySelector("[data-search-dialog-status]"),
        endpoint: indexUrl,
        limit: 8,
        idleText: "\u8F93\u5165\u5173\u952E\u8BCD\u5F00\u59CB\u641C\u7D22"
      });
      const openSearch = () => {
        if (searchDialog.open) return;
        searchDialog.showModal();
        document.body.classList.add("search-open");
        searchOpenButton.setAttribute("aria-expanded", "true");
        dialogSearch.loadIndex();
        requestAnimationFrame(() => input.focus());
      };
      const closeSearch = () => {
        if (searchDialog.open) searchDialog.close();
      };
      searchOpenButton.setAttribute("aria-expanded", "false");
      searchOpenButton.addEventListener("click", (event) => {
        event.preventDefault();
        openSearch();
      });
      searchDialog.querySelector("[data-search-close]")?.addEventListener("click", closeSearch);
      searchDialog.addEventListener("click", (event) => {
        if (event.target === searchDialog) closeSearch();
      });
      searchDialog.addEventListener("close", () => {
        document.body.classList.remove("search-open");
        searchOpenButton.setAttribute("aria-expanded", "false");
      });
      document.addEventListener("keydown", (event) => {
        if (worldDialog?.open) return;
        if (event.key === "Escape" && searchDialog.open) {
          event.preventDefault();
          closeSearch();
          return;
        }
        const target = event.target;
        const isEditing = target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
        const shortcut = event.key === "/" || (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
        if (!shortcut || isEditing) return;
        event.preventDefault();
        openSearch();
      });
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => dialogSearch.loadIndex());
      }
    }
  })();
})();
