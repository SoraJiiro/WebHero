import {
  adjustWebHeroStagePresence,
  getWebHeroMultiplier,
  getWebHeroScoreMultiplier,
  getWebHeroSustainBonus,
  groupWebHeroLyrics,
  parseWebHeroChart,
  parseWebHeroMidi,
  scheduleWebHeroLongPauses,
  scheduleWebHeroLyrics,
  scheduleWebHeroBeats,
  scheduleWebHeroTrack,
} from "./web_hero_chart.mjs";
import { parseSongIni, selectChartFolderFiles } from "./chart-import.mjs";
import {
  createGameRenderer,
  HIT_ZONE_OFFSET,
  HIT_ZONE_HEIGHT_RATIO,
  NOTE_MAX_RADIUS,
  TARGET_MAX_RADIUS,
} from "./game-renderer.mjs";
import {
  canFretHit,
  diffPadLanes,
  findAutoHitNote,
  findGuitarGroup,
  findHitNote,
  fretsMatch,
  getHoldTapLanes,
  getPressedPadButtons,
  pickPad,
  GUITAR_WINDOW,
  loadKeys,
  selectChartTrack,
} from "./utils.js";

const DEFAULT_KEYS = ["d", "f", "j", "k", "l"];
const LANE_RANKS = [0, 1, 2, 3, 4];
const SETTINGS_KEY = "web-hero-settings";
const HIGHWAY_BACKGROUND_KEY = "web-hero-highway-background";
const REWIND_MS = 3000;
const END_SILENCE_MS = 2200;
const END_FADE_MS = 900;
const COLORS = ["#ff4f64", "#ffb347", "#ffe14a", "#63e6be", "#74a7ff"];
const DIFFICULTIES = {
  easy: { label: "Facile", travelTime: 3200 },
  medium: { label: "Moyen", travelTime: 2400 },
  hard: { label: "Difficile", travelTime: 1450 },
  expert: { label: "Expert", travelTime: 1100 },
};
const DIFFICULTY_ORDER = Object.keys(DIFFICULTIES);

export function initWebHero(socket = null) {
  const stage = document.getElementById("stage22");
  const canvas = document.getElementById("web-hero-canvas");
  const startButton = document.getElementById("web-hero-start");
  const stopButton = document.getElementById("web-hero-stop");
  const chartImportButton = document.getElementById("web-hero-chart-import");
  const chartFileInput = document.getElementById("web-hero-chart-file");
  const difficultySelect = document.getElementById("web-hero-difficulty");
  const chartSpeedInput = document.getElementById("web-hero-chart-speed");
  const chartSpeedValue = document.getElementById("web-hero-chart-speed-value");
  const hyperspeedInput = document.getElementById("web-hero-hyperspeed");
  const hyperspeedValue = document.getElementById("web-hero-hyperspeed-value");
  const audioDelayInput = document.getElementById("web-hero-audio-delay");
  const audioDelayValue = document.getElementById("web-hero-audio-delay-value");
  const videoDelayInput = document.getElementById("web-hero-video-delay");
  const videoDelayValue = document.getElementById("web-hero-video-delay-value");
  const practiceInput = document.getElementById("web-hero-practice");
  const practiceStartSectionSelect = document.getElementById(
    "web-hero-practice-start-section",
  );
  const practiceEndSectionSelect = document.getElementById(
    "web-hero-practice-end-section",
  );
  const hitZonePreviewInput = document.getElementById(
    "web-hero-hit-zone-preview",
  );
  const primaryColorInput = document.getElementById("web-hero-primary-color");
  const highwayBackgroundInput = document.getElementById(
    "web-hero-highway-background",
  );
  const backgroundNameOutput = document.getElementById(
    "web-hero-background-name",
  );
  const backgroundClearButton = document.getElementById(
    "web-hero-background-clear",
  );
  const keyInputs = [...document.querySelectorAll(".web-hero-key")];
  if (
    !stage ||
    !canvas ||
    !startButton ||
    !stopButton ||
    !chartImportButton ||
    !chartFileInput ||
    !difficultySelect ||
    !chartSpeedInput ||
    !chartSpeedValue ||
    !hyperspeedInput ||
    !hyperspeedValue ||
    !practiceStartSectionSelect ||
    !practiceEndSectionSelect ||
    !primaryColorInput ||
    !highwayBackgroundInput ||
    !backgroundNameOutput ||
    !backgroundClearButton ||
    keyInputs.length !== 5
  )
    return;

  const statusEl = document.getElementById("web-hero-status-text");
  const importProgress = document.getElementById("web-hero-import-progress");
  const gameOverEl = document.getElementById("web-hero-game-over");
  const restartButton = document.getElementById("web-hero-restart");
  const returnButton = document.getElementById("web-hero-return");
  const finalScoreEl = document.getElementById("web-hero-final-score");
  const finalFcEl = document.getElementById("web-hero-final-fc");
  const finalTimeEl = document.getElementById("web-hero-final-time");
  const finalAccuracyEl = document.getElementById("web-hero-final-accuracy");
  const finalNotesEl = document.getElementById("web-hero-final-notes");
  const finalHitsEl = document.getElementById("web-hero-final-hits");
  const finalStreakEl = document.getElementById("web-hero-final-streak");
  const finalDelayEl = document.getElementById("web-hero-final-delay");
  const gameOverTitleEl = document.getElementById("web-hero-result-title");
  const gameOverSongEl = document.getElementById("web-hero-result-song");
  const lyricsEl = document.getElementById("web-hero-lyrics");
  const pauseEl = document.getElementById("web-hero-pause");
  const resumeButton = document.getElementById("web-hero-resume");
  const quitButton = document.getElementById("web-hero-quit");
  const noFailInput = document.getElementById("web-hero-nofail");
  let lyricSpans = [];
  const state = {
    running: false,
    paused: false,
    ending: false,
    endingAt: 0,
    fadeAlpha: 0,
    pausedAt: 0,
    noFail: false,
    chartSpeed: 1,
    audioDelay: 0,
    videoDelay: 0,
    hitZonePreview: false,
    score: 0,
    combo: 0,
    fullComboBroken: false,
    multiplier: 1,
    maxCombo: 0,
    misses: 0,
    hits: 0,
    hitDelayTotal: 0,
    overHits: 0,
    sustainSeconds: 0,
    longest: 0,
    stagePresence: 80,
    totalNotes: 0,
    startedAt: 0,
    notes: [],
    pendingNotes: [],
    longPauses: [],
    lyrics: [],
    lyricPhrases: [],
    lyricIndex: -1,
    lyricPhraseIndex: -1,
    lyricActiveIndex: -1,
    particles: [],
    fireAt: [-Infinity, -Infinity, -Infinity, -Infinity, -Infinity],
    beats: [],
    chart: null,
    chartTitle: "",
    primaryColor: "#ffd400",
    highwayBackground: "",
    chartDuration: 0,
    practiceRange: null,
    practiceTrack: null,
    travelTime: 0,
    animation: 0,
    lastFrame: 0,
    missFlashUntil: 0,
    heldLanes: [],
    lastHitAt: 0,
    lastFretAt: 0,
    heldSig: "",
    viewWidth: 0,
    viewHeight: 0,
    difficulty: difficultySelect.value,
    chartDifficulty: difficultySelect.value,
    scoreMultiplier: 1,
  };

  let keys = loadKeys(localStorage, "web-hero-keys", DEFAULT_KEYS);
  const { draw, getLaneBounds, getTrackBounds, resize } = createGameRenderer({
    canvas,
    state,
    keys,
    colors: COLORS,
  });
  let savedSettings = {};
  let audioContext = null;
  let audioBuffers = [];
  let audioSources = [];

  try {
    const parsedSettings = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || "{}",
    );
    if (
      parsedSettings &&
      typeof parsedSettings === "object" &&
      !Array.isArray(parsedSettings)
    )
      savedSettings = parsedSettings;
  } catch (error) {
    console.error("Impossible de lire les paramètres Web Hero.", error);
    statusEl.textContent = "Paramètres Web Hero locaux illisibles.";
  }
  if (DIFFICULTIES[savedSettings.difficulty]) {
    difficultySelect.value = savedSettings.difficulty;
    state.difficulty = savedSettings.difficulty;
  }
  state.primaryColor = /^#[\da-f]{6}$/i.test(savedSettings.primaryColor || "")
    ? savedSettings.primaryColor
    : "#ffd400";
  primaryColorInput.value = state.primaryColor;
  document.documentElement.style.setProperty("--accent", state.primaryColor);
  try {
    state.highwayBackground =
      localStorage.getItem(HIGHWAY_BACKGROUND_KEY) || "";
  } catch (error) {
    console.error("Impossible de lire l’image de fond Web Hero.", error);
  }
  backgroundNameOutput.value = state.highwayBackground
    ? "Image enregistrée"
    : "Aucune image";
  backgroundClearButton.disabled = !state.highwayBackground;
  for (const [input, value] of [
    [chartSpeedInput, savedSettings.chartSpeed],
    [hyperspeedInput, savedSettings.hyperspeed],
    [audioDelayInput, savedSettings.audioDelay],
    [videoDelayInput, savedSettings.videoDelay],
  ]) {
    if (Number.isFinite(value)) {
      input.value = String(
        Math.max(Number(input.min), Math.min(Number(input.max), value)),
      );
    }
  }
  chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
  hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
  audioDelayValue.value = `${audioDelayInput.value} ms`;
  videoDelayValue.value = `${videoDelayInput.value} ms`;
  state.audioDelay = Number(audioDelayInput.value);
  state.videoDelay = Number(videoDelayInput.value);
  state.travelTime =
    DIFFICULTIES[state.difficulty].travelTime / Number(hyperspeedInput.value);
  noFailInput.checked = savedSettings.noFail === true;
  practiceInput.checked = savedSettings.practiceMode === true;
  hitZonePreviewInput.checked = savedSettings.hitZonePreview === true;
  state.hitZonePreview = hitZonePreviewInput.checked;

  function saveSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          difficulty: difficultySelect.value,
          chartSpeed: Number(chartSpeedInput.value),
          hyperspeed: Number(hyperspeedInput.value),
          audioDelay: Number(audioDelayInput.value),
          videoDelay: Number(videoDelayInput.value),
          noFail: noFailInput.checked,
          practiceMode: practiceInput.checked,
          hitZonePreview: hitZonePreviewInput.checked,
          primaryColor: state.primaryColor,
        }),
      );
    } catch (error) {
      console.error(
        "Impossible de sauvegarder les paramètres Web Hero.",
        error,
      );
      if (!state.running)
        statusEl.textContent =
          "Impossible de sauvegarder les paramètres Web Hero localement.";
    }
  }

  function setChartControlsDisabled(disabled) {
    chartImportButton.disabled = disabled;
    difficultySelect.disabled = disabled;
    chartSpeedInput.disabled = disabled;
    hyperspeedInput.disabled = disabled;
    audioDelayInput.disabled = disabled;
    videoDelayInput.disabled = disabled;
    noFailInput.disabled = disabled;
    practiceInput.disabled = disabled;
    practiceStartSectionSelect.disabled = disabled || !practiceInput.checked;
    practiceEndSectionSelect.disabled = disabled || !practiceInput.checked;
    hitZonePreviewInput.disabled = disabled;
  }

  let keyLearn = -1;
  let guitarMode = false;
  let pauseKey = localStorage.getItem("web-hero-pause-key") || "Escape";
  let pauseKeyLearn = false;
  const keyLabel = (code) =>
    ({ ArrowUp: "↑", ArrowDown: "↓", ArrowLeft: "←", ArrowRight: "→" })[code] ??
    code.replace(/^(Key|Digit)/, "");
  const pauseKeyEl = document.getElementById("web-hero-pause-key");
  const showPauseKey = () => (pauseKeyEl.textContent = keyLabel(pauseKey));
  showPauseKey();
  pauseKeyEl.addEventListener("click", () => {
    pauseKeyLearn = true;
    pauseKeyEl.textContent = "…";
  });
  let strumKeys = JSON.parse(
    localStorage.getItem("web-hero-strum-keys") || '["ArrowUp","ArrowDown"]',
  );
  let strumKeyLearn = -1;
  const strumKeyEls = [...document.querySelectorAll(".web-hero-strum-key")];
  const showStrumKey = (i) =>
    (strumKeyEls[i].textContent = keyLabel(strumKeys[i]));
  strumKeyEls.forEach((el, i) => {
    showStrumKey(i);
    el.addEventListener("click", () => {
      if (strumKeyLearn >= 0) showStrumKey(strumKeyLearn);
      strumKeyLearn = i;
      el.textContent = "…";
    });
  });
  const showKey = (i) => (keyInputs[i].textContent = keys[i].toUpperCase());
  keyInputs.forEach((el, lane) => {
    showKey(lane);
    el.addEventListener("click", () => {
      if (keyLearn >= 0) showKey(keyLearn);
      keyLearn = lane;
      el.textContent = "…";
    });
  });
  // Retourne true si l'événement a servi à assigner (ou annuler) une touche.
  function learnKey(event) {
    if (pauseKeyLearn) {
      event.preventDefault();
      pauseKey = event.code;
      pauseKeyLearn = false;
      localStorage.setItem("web-hero-pause-key", pauseKey);
      showPauseKey();
      return true;
    }
    if (strumKeyLearn >= 0) {
      event.preventDefault();
      const i = strumKeyLearn;
      strumKeys[i] = event.code;
      strumKeyLearn = -1;
      localStorage.setItem("web-hero-strum-keys", JSON.stringify(strumKeys));
      showStrumKey(i);
      return true;
    }
    if (keyLearn < 0) return false;
    event.preventDefault();
    const lane = keyLearn;
    const value = event.key.toLowerCase();
    if (event.key === "Escape" || event.key.length !== 1) {
      if (
        event.key !== "Shift" &&
        event.key !== "Control" &&
        event.key !== "Alt"
      ) {
        keyLearn = -1;
        showKey(lane);
      }
      return true;
    }
    if (!keys.includes(value)) {
      keys[lane] = value;
      localStorage.setItem("web-hero-keys", JSON.stringify(keys));
    }
    keyLearn = -1;
    showKey(lane);
    return true;
  }

  function updateLyrics() {
    const lyric = state.lyrics[state.lyricIndex];
    if (!lyric) return;
    const phraseIndex = state.lyricPhrases.findIndex(
      (phrase) =>
        state.lyricIndex >= phrase.startIndex &&
        state.lyricIndex < phrase.endIndex,
    );
    if (phraseIndex !== state.lyricPhraseIndex) {
      const phrase = state.lyricPhrases[phraseIndex];
      lyricsEl.replaceChildren();
      lyricSpans = phrase.syllables.map((syllable) => {
        if (syllable.separatorBefore)
          lyricsEl.append(document.createTextNode(syllable.separatorBefore));
        const span = document.createElement("span");
        span.textContent = syllable.text;
        lyricsEl.append(span);
        return span;
      });
      state.lyricPhraseIndex = phraseIndex;
      state.lyricActiveIndex = -1;
    }
    const activeIndex =
      state.lyricIndex - state.lyricPhrases[phraseIndex].startIndex;
    if (activeIndex !== state.lyricActiveIndex) {
      lyricSpans.forEach((span, index) =>
        span.classList.toggle("is-active", index <= activeIndex),
      );
      state.lyricActiveIndex = activeIndex;
    }
  }

  function frame(now) {
    if (!state.running) return;
    state.lastFrame = now;
    if (state.ending) {
      state.fadeAlpha = Math.max(
        0,
        Math.min(1, (now - state.endingAt - END_SILENCE_MS) / END_FADE_MS),
      );
      draw(now + state.videoDelay);
      if (state.fadeAlpha === 1) {
        finish("Chart terminée", { completed: true });
        return;
      }
      state.animation = requestAnimationFrame(frame);
      return;
    }
    if (guitarMode) {
      // Toute variation de frettes (appui ou relâchement : pull-off) compte comme un tap.
      const sig = getHeldLanes().join();
      if (sig !== state.heldSig) {
        state.heldSig = sig;
        state.lastFretAt = now;
      }
      tryFretHit(now);
    }
    const travelTime = state.travelTime;
    const hitY = state.viewHeight - HIT_ZONE_OFFSET;
    const topY = Math.max(0, state.viewHeight * 0.05);
    const hitZoneHalfHeight =
      ((state.viewHeight - topY) * HIT_ZONE_HEIGHT_RATIO) / 2;
    const timePastHitZone =
      travelTime * (hitZoneHalfHeight / Math.max(1, hitY));
    while (
      state.pendingNotes.length > 0 &&
      state.pendingNotes[0].spawnAt <= now
    ) {
      const pendingNote = state.pendingNotes.shift();
      const hitAt = pendingNote.spawnAt + pendingNote.travelTime;
      const calibrationOffset = state.hitZonePreview
        ? state.audioDelay
        : -state.videoDelay;
      const hitUntil = hitAt + calibrationOffset + timePastHitZone;
      state.notes.push({
        lane: pendingNote.lane,
        spawnAt: pendingNote.spawnAt,
        travelTime: pendingNote.travelTime,
        hitAt,
        hitUntil,
        missAt: Math.max(hitUntil + 50, hitAt + GUITAR_WINDOW + 50),
        sustain: pendingNote.sustain,
        type: pendingNote.type,
        missed: false,
        sustainEndAt: hitAt + pendingNote.sustain * 1000,
        holding: false,
        hitRegistered: false,
      });
    }
    for (let index = state.notes.length - 1; index >= 0; index--) {
      const note = state.notes[index];
      if (!note.hitRegistered && autoHitLanes.has(note.lane)) {
        const hitIndex = findAutoHitNote(state.notes, note.lane, now);
        if (hitIndex === index) {
          if (note.sustain > 0) {
            note.holding = true;
            note.hitRegistered = true;
            note.holdMultiplier = state.multiplier;
            note.sustainStartedAt = note.hitAt;
            note.sustainScoredSeconds = 0;
            note.sustainEndAt = note.hitAt + note.sustain * 1000;
            registerHit(note, note.lane, note.hitAt);
          } else {
            state.notes.splice(index, 1);
            registerHit(note, note.lane, note.hitAt);
            continue;
          }
        }
      }
      if (note.holding) {
        creditSustain(note, now);
        if (now >= note.sustainEndAt) endSustain(note, note.sustainEndAt);
      }
      if (!note.hitRegistered && !note.missed) {
        const lateAt = guitarMode
          ? Math.min(note.hitAt + GUITAR_WINDOW, note.hitUntil)
          : note.hitUntil;
        if (lateAt < now) {
          // Un accord raté ne compte qu'un seul miss.
          const mates = guitarMode
            ? state.notes.filter(
                (n) =>
                  !n.hitRegistered &&
                  !n.missed &&
                  Math.abs(n.hitAt - note.hitAt) < 1,
              )
            : [note];
          mates.forEach((n) => (n.missed = true));
          registerMiss();
        }
      }
      if (!state.running) return;
      if (
        note.hitRegistered
          ? !note.holding && now >= note.sustainEndAt
          : note.missAt < now
      )
        state.notes.splice(index, 1);
    }
    if (
      state.pendingNotes.length === 0 &&
      state.notes.length === 0 &&
      now >= state.startedAt + state.chartDuration * 1000 + timePastHitZone
    ) {
      if (state.practiceRange) {
        repeatPractice(now);
        draw(now + state.videoDelay);
        state.animation = requestAnimationFrame(frame);
        return;
      }
      state.ending = true;
      state.endingAt = now;
      state.fadeAlpha = 0;
      stopSong();
      lyricsEl.hidden = true;
      state.animation = requestAnimationFrame(frame);
      return;
    }
    const liveElapsed = Math.max(0, (now - state.startedAt) / 1000);
    state.longest = Math.max(state.longest, liveElapsed);
    while (
      state.lyricIndex + 1 < state.lyrics.length &&
      state.lyrics[state.lyricIndex + 1].at <= now
    ) {
      state.lyricIndex += 1;
    }
    updateLyrics();
    state.heldLanes = getHeldLanes();
    draw(now + state.videoDelay);
    state.animation = requestAnimationFrame(frame);
  }

  function registerMiss() {
    if (!state.running) return;
    state.fullComboBroken = true;
    state.misses += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.combo = 0;
    state.multiplier = 1;
    state.missFlashUntil = performance.now() + 180;
    if (state.noFail) return;
    state.stagePresence = adjustWebHeroStagePresence(
      state.stagePresence,
      false,
    );
    if (state.stagePresence <= 0) {
      finish("Stage presence épuisée");
    }
  }

  function registerOverHit() {
    if (!state.running) return;
    state.fullComboBroken = true;
    if (guitarMode && !state.noFail) {
      state.stagePresence = adjustWebHeroStagePresence(
        state.stagePresence,
        false,
      );
      if (state.stagePresence <= 0) {
        registerMiss();
        return;
      }
    }
    state.overHits += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.combo = 0;
    state.multiplier = 1;
    state.missFlashUntil = performance.now() + 180;
  }

  function stopSong() {
    for (const source of audioSources) {
      source.onended = null;
      source.stop();
      source.disconnect();
    }
    audioSources = [];
  }

  function finish(
    message = "Partie terminee",
    { completed = false, stopped = false } = {},
  ) {
    if (!state.running) return;
    const endedAt =
      state.endingAt || (state.paused ? state.pausedAt : performance.now());
    state.paused = false;
    state.ending = false;
    pauseEl.hidden = true;
    state.running = false;
    stopSong();
    stage.classList.remove("is-playing");
    cancelAnimationFrame(state.animation);
    const duration = Math.max(
      0,
      Math.floor((endedAt - state.startedAt) / 1000),
    );
    state.longest = Math.max(state.longest, duration);
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    startButton.disabled = false;
    stopButton.hidden = true;
    statusEl.textContent = `${message} - ${state.score} points`;
    const finalDuration = Math.floor(duration);
    const accuracy =
      state.hits + state.misses
        ? Math.round((state.hits / (state.hits + state.misses)) * 100)
        : 0;
    gameOverTitleEl.textContent = completed
      ? "CHART TERMINÉE"
      : stopped
        ? "PARTIE ARRÊTÉE"
        : "GAME OVER";
    gameOverSongEl.textContent = state.chartTitle;
    gameOverEl.classList.toggle("is-completed", completed);
    gameOverEl.classList.toggle("is-stopped", stopped);
    finalScoreEl.textContent = state.score.toLocaleString("fr-FR");
    finalFcEl.hidden = !(
      completed &&
      state.hits === state.totalNotes &&
      state.misses === 0 &&
      state.overHits === 0
    );
    finalTimeEl.textContent = `${finalDuration}s`;
    finalAccuracyEl.textContent = `${accuracy}%`;
    finalNotesEl.textContent = state.totalNotes.toLocaleString("fr-FR");
    finalHitsEl.textContent = `${state.hits} / ${state.misses}`;
    finalStreakEl.textContent = state.maxCombo.toLocaleString("fr-FR");
    const averageHitDelay = state.hits
      ? Math.round(state.hitDelayTotal / state.hits)
      : null;
    finalDelayEl.textContent =
      averageHitDelay === null
        ? "—"
        : `${averageHitDelay > 0 ? "+" : ""}${averageHitDelay} ms`;
    gameOverEl.hidden = false;
    restartButton.focus();
    setChartControlsDisabled(false);
    if (completed && socket && !state.noFail) {
      socket.emit("webhero:final", {
        score: state.score,
        duration,
        difficulty: state.chartDifficulty,
        chartSpeed: Number(chartSpeedInput.value),
        hyperspeed: Number(hyperspeedInput.value),
        totalNotes: state.totalNotes,
        hits: state.hits,
        misses: state.misses,
        sustainSeconds: state.sustainSeconds,
        completed,
      });
    }
    lyricsEl.hidden = true;
  }

  function shiftTimes(delta) {
    const shift = (o, ...ks) =>
      ks.forEach((k) => typeof o[k] === "number" && (o[k] += delta));
    state.notes.forEach((n) =>
      shift(
        n,
        "spawnAt",
        "hitAt",
        "missAt",
        "sustainEndAt",
        "sustainStartedAt",
        "releasedAt",
        "lastParticleAt",
      ),
    );
    state.pendingNotes.forEach((n) => shift(n, "spawnAt"));
    state.lyrics.forEach((l) => shift(l, "at"));
    state.lyricPhrases.forEach((p) =>
      p.syllables.forEach((s) => shift(s, "at")),
    );
    state.longPauses.forEach((p) => shift(p, "startAt", "endAt", "nextNoteAt"));
    state.particles.forEach((p) => shift(p, "createdAt"));
    state.fireAt = state.fireAt.map((t) => t + delta);
    state.beats.forEach((b) => shift(b, "hitAt"));
    shift(
      state,
      "startedAt",
      "missFlashUntil",
      "lastHitAt",
      "lastFretAt",
      "lastFrame",
    );
  }

  function pause() {
    if (!state.running || state.paused || state.ending) return;
    state.paused = true;
    state.pausedAt = performance.now();
    cancelAnimationFrame(state.animation);
    for (const note of state.notes) {
      if (note.holding) endSustain(note, state.pausedAt);
    }
    stopSong();
    pauseEl.hidden = false;
    resumeButton.focus();
  }

  // Recule la chart et la musique de ms ; les notes déjà jouées ne reviennent pas.
  function rewindChart(ms) {
    const upcoming = state.notes.filter((n) => !n.hitRegistered && !n.missed);
    state.notes = state.notes.filter((n) => n.hitRegistered || n.missed);
    state.pendingNotes.unshift(
      ...upcoming.map(({ lane, spawnAt, travelTime, sustain, type }) => ({
        lane,
        spawnAt,
        travelTime,
        sustain,
        type,
      })),
    );
    state.pendingNotes.forEach((n) => (n.spawnAt += ms));
    state.lyrics.forEach((l) => (l.at += ms));
    state.lyricPhrases.forEach((p) => p.syllables.forEach((s) => (s.at += ms)));
    state.longPauses.forEach((p) => {
      p.startAt += ms;
      p.endAt += ms;
      p.nextNoteAt += ms;
    });
    state.startedAt += ms;
    state.beats.forEach((b) => (b.hitAt += ms));
  }

  function getPracticeSegment(track) {
    const sections = state.chart.sections || [];
    const startIndex = Number(practiceStartSectionSelect.value);
    const endIndex = Number(practiceEndSectionSelect.value);
    const hasStart = Number.isInteger(startIndex) && startIndex >= 0;
    const start = hasStart ? sections[startIndex]?.time : 0;
    const segmentStart = Math.min(
      track.duration,
      Math.max(0, Number.isFinite(start) ? start : 0),
    );
    const hasEnd = Number.isInteger(endIndex) && endIndex >= startIndex;
    const endStart = hasEnd ? sections[endIndex]?.time : undefined;
    const nextSection = hasEnd
      ? sections.slice(endIndex + 1).find((section) => section.time > endStart)
      : null;
    const end = hasEnd ? (nextSection?.time ?? track.duration) : track.duration;
    const segmentEnd = Math.max(segmentStart, Math.min(track.duration, end));
    if (segmentEnd <= segmentStart) {
      return {
        start: 0,
        end: track.duration,
        track,
      };
    }
    return {
      start: segmentStart,
      end: segmentEnd,
      track: {
        ...track,
        notes: track.notes
          .filter((note) => note.time >= segmentStart && note.time < segmentEnd)
          .map((note) => ({
            ...note,
            time: note.time - segmentStart,
            sustain: Math.min(note.sustain, segmentEnd - note.time),
          })),
        duration: segmentEnd - segmentStart,
      },
    };
  }

  function scheduleTimeline(track, startAt) {
    const schedule = scheduleWebHeroTrack(
      track,
      startAt,
      state.travelTime,
      state.chartSpeed,
    );
    state.longPauses = scheduleWebHeroLongPauses(
      track,
      schedule.startAt,
      state.chartSpeed,
    );
    state.notes = [];
    state.pendingNotes = schedule.notes;
    state.lyrics = scheduleWebHeroLyrics(
      (state.chart.lyrics || [])
        .filter(
          (lyric) =>
            !state.practiceRange ||
            (lyric.time >= state.practiceRange.start &&
              lyric.time < state.practiceRange.end),
        )
        .map((lyric) => ({
          ...lyric,
          time: lyric.time - (state.practiceRange?.start || 0),
        })),
      schedule.startAt,
      state.chartSpeed,
    );
    state.lyricPhrases = groupWebHeroLyrics(state.lyrics);
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    lyricsEl.replaceChildren();
    lyricsEl.hidden = state.lyrics.length === 0;
    state.beats = scheduleWebHeroBeats(
      (state.chart.beats || [])
        .filter(
          (beat) =>
            !state.practiceRange ||
            (beat.time >= state.practiceRange.start &&
              beat.time < state.practiceRange.end),
        )
        .map((beat) => ({
          ...beat,
          time: beat.time - (state.practiceRange?.start || 0),
        })),
      schedule.startAt,
      state.chartSpeed,
    );
    state.chartDuration = schedule.duration;
    state.startedAt = schedule.startAt;
    return schedule;
  }

  function repeatPractice(now) {
    stopSong();
    state.score = 0;
    state.combo = 0;
    state.fullComboBroken = false;
    state.multiplier = 1;
    state.maxCombo = 0;
    state.hits = 0;
    state.misses = 0;
    state.hitDelayTotal = 0;
    state.overHits = 0;
    state.sustainSeconds = 0;
    state.longest = 0;
    state.stagePresence = 80;
    state.missFlashUntil = 0;
    state.fireAt = state.fireAt.map(() => -Infinity);
    state.particles = [];
    const schedule = scheduleTimeline(
      state.practiceTrack,
      now + state.travelTime,
    );
    if (audioBuffers.length) {
      playAudio(
        state.chartSpeed,
        audioContext.currentTime +
          Math.max(0, state.travelTime + state.audioDelay) / 1000,
        state.practiceRange.start,
        state.practiceRange.end - state.practiceRange.start,
      );
    }
    state.lastFrame = schedule.startAt;
  }

  function resume() {
    if (!state.running || !state.paused) return;
    const now = performance.now();
    shiftTimes(now - state.pausedAt);
    rewindChart(REWIND_MS);
    state.lyricIndex = state.lyrics.findLastIndex((l) => l.at <= now);
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    if (audioBuffers.length) {
      const songPos =
        ((now - state.startedAt - state.audioDelay) / 1000) * state.chartSpeed;
      playAudio(
        state.chartSpeed,
        audioContext.currentTime + Math.max(0, -songPos) / state.chartSpeed,
        (state.practiceRange?.start || 0) + Math.max(0, songPos),
        state.practiceRange
          ? Math.max(
              0,
              state.practiceRange.end -
                state.practiceRange.start -
                Math.max(0, songPos),
            )
          : undefined,
      );
    }
    state.paused = false;
    pauseEl.hidden = true;
    canvas.focus({ preventScroll: true });
    state.animation = requestAnimationFrame(frame);
  }

  function startPressed() {
    if (state.ending) return;
    if (state.running) return state.paused ? resume() : pause();
    if (!startButton.disabled) start();
  }

  async function start() {
    if (state.running) return;
    if (!state.chart) {
      statusEl.textContent =
        "Importez un fichier .chart ou .mid pour commencer.";
      return;
    }
    startButton.disabled = true;
    stopButton.disabled = true;
    setChartControlsDisabled(true);
    try {
      if (audioBuffers.length) {
        audioContext ||= new AudioContext();
        await audioContext.resume();
      }
    } catch (error) {
      startButton.disabled = false;
      setChartControlsDisabled(false);
      statusEl.textContent = `Préparation audio impossible : ${error.message}`;
      console.error("Impossible de préparer la bande-son importée.", error);
      return;
    }
    state.difficulty = difficultySelect.value;
    const { difficulty: chartDifficulty, track: chartTrack } = selectChartTrack(
      state.chart,
      state.difficulty,
      DIFFICULTY_ORDER,
    );
    const chartSpeed = Number(chartSpeedInput.value);
    const hyperspeed = Number(hyperspeedInput.value);
    const travelTime = DIFFICULTIES[state.difficulty].travelTime / hyperspeed;
    const startAt = performance.now() + travelTime;
    const audioDelay = Number(audioDelayInput.value);
    state.travelTime = travelTime;
    state.chartSpeed = chartSpeed;
    state.audioDelay = audioDelay;
    state.videoDelay = Number(videoDelayInput.value);
    state.practiceRange = practiceInput.checked
      ? getPracticeSegment(chartTrack)
      : null;
    state.practiceTrack = state.practiceRange?.track || chartTrack;
    const audioStartAt = audioBuffers.length
      ? audioContext.currentTime + Math.max(0, travelTime + audioDelay) / 1000
      : null;
    const schedule = scheduleTimeline(state.practiceTrack, startAt);
    state.running = true;
    stage.classList.add("is-playing");
    gameOverEl.hidden = true;
    canvas.focus({ preventScroll: true });
    state.score = 0;
    state.combo = 0;
    state.multiplier = 1;
    state.maxCombo = 0;
    state.misses = 0;
    state.hits = 0;
    state.hitDelayTotal = 0;
    state.overHits = 0;
    state.sustainSeconds = 0;
    state.stagePresence = 80;
    state.noFail = noFailInput.checked;
    state.paused = false;
    state.ending = false;
    state.endingAt = 0;
    state.fadeAlpha = 0;
    state.totalNotes = schedule.notes.length;
    state.chartDifficulty = chartDifficulty;
    state.scoreMultiplier = getWebHeroScoreMultiplier(
      chartDifficulty,
      chartSpeed,
      hyperspeed,
    );
    state.longest = 0;
    state.particles = [];
    state.lastFrame = state.startedAt;
    startButton.disabled = true;
    stopButton.hidden = false;
    stopButton.disabled = false;
    setChartControlsDisabled(true);
    statusEl.textContent = `En jeu — ${DIFFICULTIES[chartDifficulty].label} (${chartTrack.name})`;
    state.animation = requestAnimationFrame(frame);
    if (audioBuffers.length) {
      playAudio(
        chartSpeed,
        audioStartAt,
        state.practiceRange?.start || 0,
        state.practiceRange
          ? state.practiceRange.end - state.practiceRange.start
          : undefined,
      );
    } else {
      statusEl.textContent += " — aucune bande-son associée";
    }
  }

  // offset en secondes de buffer ; startAt en temps AudioContext.
  function playAudio(chartSpeed, startAt, offset, duration) {
    for (const buffer of audioBuffers) {
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      source.playbackRate.value = chartSpeed;
      gain.gain.value = 1 / audioBuffers.length;
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.onended = () => {
        source.disconnect();
        audioSources = audioSources.filter((active) => active !== source);
      };
      audioSources.push(source);
      if (duration === undefined) source.start(startAt, offset);
      else source.start(startAt, offset, duration);
    }
  }

  function registerHit(hitNote, lane, now) {
    state.fireAt[lane] = now;
    state.hits += 1;
    state.hitDelayTotal += now - hitNote.hitAt;
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.multiplier = getWebHeroMultiplier(state.combo);
    state.stagePresence = adjustWebHeroStagePresence(state.stagePresence, true);
    state.score += Math.round(100 * state.multiplier * state.scoreMultiplier);
  }

  function creditSustain(note, at) {
    const heldSeconds = Math.min(
      note.sustain,
      Math.max(0, (at - note.sustainStartedAt) / 1000),
    );
    const scoredSeconds = note.sustainScoredSeconds || 0;
    state.score +=
      getWebHeroSustainBonus(
        heldSeconds,
        note.holdMultiplier,
        state.scoreMultiplier,
      ) -
      getWebHeroSustainBonus(
        scoredSeconds,
        note.holdMultiplier,
        state.scoreMultiplier,
      );
    note.sustainScoredSeconds = heldSeconds;
    return heldSeconds;
  }

  function endSustain(note, endedAt) {
    const heldSeconds = creditSustain(note, endedAt);
    state.sustainSeconds += heldSeconds;
    note.holding = false;
    note.releasedAt = endedAt;
  }

  function hit(lane) {
    if (!state.running || state.paused || state.ending) return;
    const now = performance.now();
    if (
      state.longPauses.some(
        (pause) => now >= pause.startAt && now < pause.endAt,
      )
    )
      return;
    if (lane < 0) {
      registerMiss();
      return;
    }
    const index = findHitNote(state.notes, [lane], now);
    if (index < 0) {
      const expiredIndex = state.notes.findIndex(
        (note) =>
          note.lane === lane && !note.hitRegistered && now > note.missAt,
      );
      if (expiredIndex >= 0) {
        state.notes.splice(expiredIndex, 1);
        registerMiss();
        return;
      }
      // Pas de pénalité si on rejoue une lane en sustain ou qu'une autre frette est tenue (tap).
      if (
        state.notes.some((n) => n.lane === lane && n.holding) ||
        getHeldLanes().some((l) => l !== lane)
      )
        return;
      registerOverHit();
      return;
    }
    consume(index, now, registerLaneHit);
  }

  function consume(index, now, register) {
    const hitNote = state.notes[index];
    if (hitNote.sustain > 0) {
      hitNote.holding = true;
      hitNote.hitRegistered = true;
      hitNote.holdMultiplier = state.multiplier;
      hitNote.sustainStartedAt = now;
      hitNote.sustainScoredSeconds = 0;
      hitNote.sustainEndAt = hitNote.hitAt + hitNote.sustain * 1000;
      register(hitNote, hitNote.lane, now);
      return;
    }
    state.notes.splice(index, 1);
    register(hitNote, hitNote.lane, now);
  }

  function hitGuitarGroup(group, now) {
    for (const note of group.notes) {
      consume(state.notes.indexOf(note), now, registerHit);
    }
    state.lastHitAt = now;
  }

  function strum() {
    if (!state.running || state.paused || state.ending) return;
    const now = performance.now();
    if (state.longPauses.some((p) => now >= p.startAt && now < p.endAt)) return;
    const group = findGuitarGroup(state.notes, now);
    if (group && fretsMatch(group.lanes, getHeldLanes()))
      hitGuitarGroup(group, now);
    else registerOverHit();
  }

  // HOPO (chaîne en cours) et TAP : validés par une frette pressée, sans strum.
  function tryFretHit(now) {
    if (
      !state.running ||
      state.paused ||
      state.ending ||
      state.lastFretAt <= state.lastHitAt
    )
      return;
    const group = findGuitarGroup(state.notes, now);
    if (
      group &&
      canFretHit(group.type, state.combo) &&
      fretsMatch(group.lanes, getHeldLanes())
    )
      hitGuitarGroup(group, now);
  }

  function fretDown() {
    state.lastFretAt = performance.now();
    // La frette est ajoutée aux touches tenues après pressLane.
    queueMicrotask(() => tryFretHit(performance.now()));
  }

  function registerLaneHit(note, lane, now) {
    registerHit(note, lane, now);
    for (const heldLane of getHoldTapLanes(
      lane,
      getHeldLanes(),
      LANE_RANKS,
    ).slice(1)) {
      autoHitLanes.add(heldLane);
    }
  }

  function release(key) {
    if (!state.running) return;
    const lane = keys.indexOf(key.toLowerCase());
    const index = state.notes.findIndex(
      (note) => note.lane === lane && note.holding,
    );
    if (index < 0) return;
    const note = state.notes[index];
    endSustain(
      note,
      Math.min(
        state.paused ? state.pausedAt : performance.now(),
        note.sustainEndAt,
      ),
    );
  }

  const heldKeyboardLanes = new Map();
  const heldTouchPointers = new Map();
  const heldTouchLanes = new Map();
  const heldCanvasPointers = new Map();
  const autoHitLanes = new Set();
  function getHeldLanes() {
    return [...heldKeyboardLanes.values(), ...heldTouchLanes.keys()];
  }
  function pressLane(lane) {
    if (guitarMode) fretDown();
    else hit(lane);
  }
  function clearHeldKeys() {
    for (const lane of new Set([
      ...heldKeyboardLanes.values(),
      ...heldTouchLanes.keys(),
    ]))
      release(keys[lane]);
    heldKeyboardLanes.clear();
    heldTouchPointers.clear();
    heldTouchLanes.clear();
    heldCanvasPointers.clear();
    document.querySelectorAll(".touch-lane.is-pressed").forEach((button) => {
      button.classList.remove("is-pressed");
    });
    for (const lane of autoHitLanes) {
      if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
    }
  }

  document.querySelectorAll(".touch-lane").forEach((button, lane) => {
    const finishTouch = (event) => {
      if (heldTouchPointers.get(event.pointerId) !== lane) return;
      heldTouchPointers.delete(event.pointerId);
      const pointers = heldTouchLanes.get(lane);
      pointers.delete(event.pointerId);
      if (pointers.size === 0) {
        heldTouchLanes.delete(lane);
        button.classList.remove("is-pressed");
        release(keys[lane]);
        if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
      }
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (event.button !== 0) return;
      if (heldTouchPointers.has(event.pointerId)) return;
      const pointers = heldTouchLanes.get(lane) || new Set();
      if (pointers.size === 0) pressLane(lane);
      pointers.add(event.pointerId);
      heldTouchLanes.set(lane, pointers);
      heldTouchPointers.set(event.pointerId, lane);
      button.classList.add("is-pressed");
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", finishTouch);
    button.addEventListener("pointercancel", finishTouch);
    button.addEventListener("lostpointercapture", finishTouch);
    button.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      pressLane(lane);
      release(keys[lane]);
    });
  });
  const finishCanvasTouch = (event) => {
    const lane = heldCanvasPointers.get(event.pointerId);
    if (lane === undefined) return;
    heldCanvasPointers.delete(event.pointerId);
    const pointers = heldTouchLanes.get(lane);
    pointers.delete(event.pointerId);
    if (pointers.size === 0) {
      heldTouchLanes.delete(lane);
      release(keys[lane]);
      if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
    }
  };
  canvas.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "touch" || !state.running) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) * state.viewWidth) / rect.width;
    const y = ((event.clientY - rect.top) * state.viewHeight) / rect.height;
    const track = getTrackBounds();
    const lane = Math.floor((x - track.x) / track.laneWidth);
    const targetRadius = Math.min(TARGET_MAX_RADIUS, track.laneWidth / 2 - 5);
    const touchRadius = Math.min(
      track.laneWidth / 2,
      Math.max(24, targetRadius + 8),
    );
    if (
      x < track.x ||
      x >= track.x + track.width ||
      lane < 0 ||
      lane >= 5 ||
      Math.abs(y - (state.viewHeight - HIT_ZONE_OFFSET)) > touchRadius
    )
      return;
    event.preventDefault();
    const pointers = heldTouchLanes.get(lane) || new Set();
    if (pointers.size === 0) pressLane(lane);
    pointers.add(event.pointerId);
    heldTouchLanes.set(lane, pointers);
    heldCanvasPointers.set(event.pointerId, lane);
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointerup", finishCanvasTouch);
  canvas.addEventListener("pointercancel", finishCanvasTouch);
  canvas.addEventListener("lostpointercapture", finishCanvasTouch);

  startButton.addEventListener("click", start);
  stopButton.addEventListener("click", () =>
    finish("Partie arrêtée — score non enregistré", { stopped: true }),
  );
  restartButton.addEventListener("click", start);
  resumeButton.addEventListener("click", resume);
  quitButton.addEventListener("click", () =>
    finish("Partie arrêtée — score non enregistré", { stopped: true }),
  );
  noFailInput.addEventListener("change", saveSettings);
  returnButton?.addEventListener("click", () => {
    state.ending = false;
    state.endingAt = 0;
    state.fadeAlpha = 0;
    state.notes = [];
    state.pendingNotes = [];
    state.particles = [];
    state.lyrics = [];
    state.lyricPhrases = [];
    state.lyricIndex = -1;
    state.lyricPhraseIndex = -1;
    state.lyricActiveIndex = -1;
    lyricsEl.replaceChildren();
    lyricsEl.hidden = true;
    gameOverEl.hidden = true;
    stage.classList.remove("is-playing");
    draw(performance.now());
    statusEl.textContent = "Prêt à jouer.";
    startButton.focus({ preventScroll: true });
  });
  chartImportButton.addEventListener("click", () => chartFileInput.click());
  document
    .getElementById("fullscreen-button")
    ?.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        } else {
          await stage.requestFullscreen();
        }
      } catch (error) {
        statusEl.textContent = `Plein écran indisponible : ${error.message}`;
      }
    });
  chartSpeedInput.addEventListener("input", () => {
    chartSpeedValue.value = `${Math.round(Number(chartSpeedInput.value) * 100)} %`;
    saveSettings();
  });
  hyperspeedInput.addEventListener("input", () => {
    hyperspeedValue.value = `${Number(hyperspeedInput.value).toFixed(1)}×`;
    if (!state.running)
      state.travelTime =
        DIFFICULTIES[difficultySelect.value].travelTime /
        Number(hyperspeedInput.value);
    saveSettings();
    draw(performance.now());
  });
  for (const [input, output, property] of [
    [audioDelayInput, audioDelayValue, "audioDelay"],
    [videoDelayInput, videoDelayValue, "videoDelay"],
  ]) {
    input.addEventListener("input", () => {
      output.value = `${input.value} ms`;
      state[property] = Number(input.value);
      saveSettings();
      draw(performance.now());
    });
  }
  practiceInput.addEventListener("change", () => {
    practiceStartSectionSelect.disabled =
      !practiceInput.checked || state.running;
    practiceEndSectionSelect.disabled = !practiceInput.checked || state.running;
    saveSettings();
  });
  function updatePracticeEndSections() {
    const sections = state.chart?.sections || [];
    const startIndex = Number(practiceStartSectionSelect.value);
    const previousEnd = practiceEndSectionSelect.value;
    const options = [new Option("Fin de la chart", "-1")];
    sections.forEach((section, index) => {
      if (startIndex < 0 || index >= startIndex)
        options.push(new Option(section.name, String(index)));
    });
    practiceEndSectionSelect.replaceChildren(...options);
    practiceEndSectionSelect.value = options.some(
      (option) => option.value === previousEnd,
    )
      ? previousEnd
      : "-1";
  }
  practiceStartSectionSelect.addEventListener("change", () => {
    updatePracticeEndSections();
    saveSettings();
  });
  practiceEndSectionSelect.addEventListener("change", saveSettings);
  hitZonePreviewInput.addEventListener("change", () => {
    state.hitZonePreview = hitZonePreviewInput.checked;
    saveSettings();
    draw(performance.now());
  });
  primaryColorInput.addEventListener("input", () => {
    state.primaryColor = primaryColorInput.value;
    document.documentElement.style.setProperty("--accent", state.primaryColor);
    saveSettings();
    draw(performance.now());
  });
  highwayBackgroundInput.addEventListener("change", async () => {
    const file = highwayBackgroundInput.files?.[0];
    if (!file) return;
    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 1600 / bitmap.width, 900 / bitmap.height);
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = Math.max(1, Math.round(bitmap.width * scale));
      imageCanvas.height = Math.max(1, Math.round(bitmap.height * scale));
      imageCanvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, imageCanvas.width, imageCanvas.height);
      bitmap.close();
      const image = imageCanvas.toDataURL("image/webp", 0.78);
      if (image.length > 2_000_000)
        throw new Error("Image trop volumineuse après compression.");
      localStorage.setItem(HIGHWAY_BACKGROUND_KEY, image);
      state.highwayBackground = image;
      backgroundNameOutput.value = file.name;
      backgroundClearButton.disabled = false;
      draw(performance.now());
    } catch (error) {
      statusEl.textContent = `Image de fond impossible : ${error.message}`;
    } finally {
      highwayBackgroundInput.value = "";
    }
  });
  backgroundClearButton.addEventListener("click", () => {
    var confirmClear = confirm(
      "Voulez-vous vraiment supprimer l'image de fond ?",
    );
    if (!confirmClear) return;
    localStorage.removeItem(HIGHWAY_BACKGROUND_KEY);
    state.highwayBackground = "";
    backgroundNameOutput.value = "Aucune image";
    backgroundClearButton.disabled = true;
    draw(performance.now());
  });
  chartFileInput.addEventListener("change", async () => {
    const files = [...chartFileInput.files];
    if (!files.length) return;
    try {
      if (state.running)
        throw new Error("Terminez la partie avant d’importer.");
      setChartControlsDisabled(true);
      startButton.disabled = true;
      const {
        chartFile: file,
        audioFiles,
        iniFile,
        folderName,
      } = selectChartFolderFiles(files);
      const totalSteps = 1 + audioFiles.length;
      let doneSteps = 0;
      const progress = (label) => {
        importProgress.hidden = false;
        importProgress.value = doneSteps / totalSteps;
        statusEl.textContent = `${label} — ${Math.round((doneSteps / totalSteps) * 100)} %`;
      };
      progress("Lecture de la chart");
      await new Promise((resolve) => setTimeout(resolve));
      const extension = file.name.split(".").pop().toLowerCase();
      let chart;
      const songName = iniFile
        ? parseSongIni(await iniFile.text()) || folderName
        : folderName;
      if (extension === "chart") {
        chart = parseWebHeroChart(await file.text());
      } else {
        chart = parseWebHeroMidi(await file.arrayBuffer());
      }
      doneSteps++;
      const decodedAudio = [];
      if (audioFiles.length) {
        audioContext ||= new AudioContext();
        for (const [index, audioFile] of audioFiles.entries()) {
          progress(`Audio ${index + 1}/${audioFiles.length}`);
          decodedAudio.push(
            await audioContext.decodeAudioData(await audioFile.arrayBuffer()),
          );
          doneSteps++;
        }
      }
      importProgress.value = 1;
      stopSong();
      state.chart = chart;
      state.chartTitle = songName;
      audioBuffers = decodedAudio;
      practiceStartSectionSelect.replaceChildren(
        new Option("Début de la chart", "-1"),
        ...(chart.sections || []).map(
          (section, index) => new Option(section.name, String(index)),
        ),
      );
      practiceStartSectionSelect.value = "-1";
      updatePracticeEndSections();
      practiceStartSectionSelect.disabled = !practiceInput.checked;
      practiceEndSectionSelect.disabled = !practiceInput.checked;
      const selectedTrack = selectChartTrack(
        state.chart,
        difficultySelect.value,
        DIFFICULTY_ORDER,
      );
      gameOverEl.hidden = true;
      const audioStatus = audioFiles.length
        ? `${audioFiles.length} piste${audioFiles.length === 1 ? "" : "s"} audio synchronisée${audioFiles.length === 1 ? "" : "s"}`
        : "sans bande-son associée";
      statusEl.textContent = `${songName} chargé — ${selectedTrack.track.notes.length} notes (${selectedTrack.track.name}), ${audioStatus}.`;
    } catch (error) {
      statusEl.textContent = `Import impossible : ${error.message}`;
    } finally {
      chartFileInput.value = "";
      importProgress.hidden = true;
      if (!state.running) {
        setChartControlsDisabled(false);
        startButton.disabled = false;
      }
    }
  });
  difficultySelect.addEventListener("change", () => {
    const newDifficulty = difficultySelect.value;
    state.difficulty = newDifficulty;
    if (!state.running)
      state.travelTime =
        DIFFICULTIES[newDifficulty].travelTime / Number(hyperspeedInput.value);
    saveSettings();
    if (!state.running) return;
    finish("Partie abandonnée : difficulté modifiée", { save: false });
  });
  window.addEventListener("keydown", (event) => {
    if (learnKey(event)) return;
    if (event.code === pauseKey && state.running) {
      state.paused ? resume() : pause();
      return;
    }
    if (event.repeat || event.target.matches("input, textarea, select")) return;
    if (guitarMode && strumKeys.includes(event.code)) {
      event.preventDefault();
      strum();
      return;
    }
    const lane = keys.indexOf(event.key.toLowerCase());
    if (lane < 0 || event.ctrlKey || event.altKey || event.metaKey) return;
    pressLane(lane);
    heldKeyboardLanes.set(event.code, lane);
  });
  window.addEventListener("keyup", (event) => {
    const lane = heldKeyboardLanes.get(event.code);
    if (lane === undefined) {
      release(event.key);
      return;
    }
    heldKeyboardLanes.delete(event.code);
    release(keys[lane]);
    if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
  });
  // Une lane = ensemble de boutons (certaines guitares en envoient plusieurs par frette).
  const padButtons = JSON.parse(
    localStorage.getItem("web-hero-pad") || "[1,4,3,0,2]",
  ).map((b) => [].concat(b));
  // Ensembles 5 = pause (Start), 6 et 7 = strum haut/bas (croix directionnelle).
  [[9], [12], [13]].forEach((defaults, i) => (padButtons[5 + i] ??= defaults));
  const padEls = [...document.querySelectorAll(".web-hero-pad")];
  let padLearn = -1;
  const padDebugEl = document.getElementById("web-hero-pad-debug");
  const padSeen = new Set();
  const padLabel = (i) => padButtons[i].map((b) => `B${b}`).join("+");
  padEls.forEach((el, lane) => {
    el.textContent = padLabel(lane);
    el.addEventListener("click", () => {
      padLearn = lane;
      padSeen.clear();
      el.textContent = "…";
    });
  });
  const padWasDown = new Set();
  function pollPads() {
    const pads = navigator.getGamepads?.() ?? [];
    guitarMode = pads.some(Boolean);
    const down = getPressedPadButtons(pads);
    const axes = (pickPad(pads)?.axes ?? []).flatMap((v, i) =>
      Math.abs(v) > 0.5 ? [`A${i}`] : [],
    );
    padDebugEl.title = pads
      .filter(Boolean)
      .map((p) => `${p.id} [${p.mapping}]`)
      .join(" | ");
    padDebugEl.textContent = [...[...down].map((b) => `B${b}`), ...axes].join(
      " ",
    );
    if (padLearn >= 0) {
      down.forEach((b) => padSeen.add(b));
      if (down.size === 0 && padSeen.size > 0) {
        padButtons[padLearn] = [...padSeen].sort((a, b) => a - b);
        padSeen.clear();
        localStorage.setItem("web-hero-pad", JSON.stringify(padButtons));
        padEls[padLearn].textContent = padLabel(padLearn);
        padLearn = -1;
      }
    } else {
      const held = new Set(
        [...heldKeyboardLanes]
          .filter(([id]) => id.startsWith("pad"))
          .map(([, l]) => l),
      );
      const { press, releaseLanes } = diffPadLanes(
        padButtons.slice(0, 5),
        down,
        held,
      );
      for (const lane of press) {
        pressLane(lane);
        heldKeyboardLanes.set(`pad${lane}`, lane);
      }
      for (const lane of releaseLanes) {
        heldKeyboardLanes.delete(`pad${lane}`);
        release(keys[lane]);
        if (!getHeldLanes().includes(lane)) autoHitLanes.delete(lane);
      }
    }
    // Strum = croix directionnelle haut/bas (guitares XInput)
    const isOn = (set, i) =>
      padButtons[i].length > 0 && padButtons[i].every((b) => set.has(b));
    if (padLearn < 0 && isOn(down, 5) && !isOn(padWasDown, 5)) startPressed();
    if (guitarMode && padLearn < 0) {
      for (const i of [6, 7])
        if (isOn(down, i) && !isOn(padWasDown, i)) strum();
    }
    if (!state.running) {
      const held = getHeldLanes();
      if (held.join() !== state.heldLanes.join()) {
        state.heldLanes = held;
        draw(performance.now());
      }
    }
    padWasDown.clear();
    down.forEach((b) => padWasDown.add(b));
    requestAnimationFrame(pollPads);
  }
  requestAnimationFrame(pollPads);
  window.addEventListener("blur", clearHeldKeys);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearHeldKeys();
      pause();
    }
  });
  window.addEventListener("resize", resize);
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();
  draw(0);
  if (!state.chart)
    statusEl.textContent =
      "Importez une chart .chart/.mid, avec ses fichiers audio pour jouer en musique.";
  if (canvas) canvas.focus();
  /*alert(
    "Sur PC, utilisez l'option de plein écran pour une meilleure expérience.",
  );*/
}

initWebHero();
