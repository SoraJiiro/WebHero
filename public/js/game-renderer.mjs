export const HIT_ZONE_OFFSET = 90;
export const TARGET_MAX_RADIUS = 30;
export const NOTE_MAX_RADIUS = 26;

// Feuille de sprites : colonnes vert/rouge/jaune/bleu/orange ; lignes 0 note, 1 lumineuse, 2 vitre.
const SPRITE_COL = [1, 4, 2, 0, 3];
const SPRITE_PITCH = { x: 290.4, y: 219 };
const SPRITE_ART = { dx: 8, dy: 20, w: 278, h: 190 };

// Hitter (1559 x 1009, fond noir opaque) : 5 colonnes de 291,5 px, 3 lignes de 289 px.
const HITTER = { x: 47.25, y: 60.5, w: 291.5, h: 289 };
// Feu : 7 frames de 114,3 x 162 ; la rafale joue 0..6, le sustain boucle sur 4 frames.
const FIRE = {
  frames: 7,
  w: 800 / 7,
  h: 162,
  burstMs: 45,
  loop: [0, 2, 1, 3],
  loopMs: 70,
};
const HIT_FLASH_MS = 110;

export function createGameRenderer({ canvas, state, keys, colors }) {
  const ctx = canvas.getContext("2d");
  const loadImage = (name) => {
    const img = new Image();
    img.onload = () => draw(performance.now());
    img.src = new URL(`../assets/hud/${name}`, import.meta.url).href;
    return img;
  };
  const notesImg = loadImage("notes.png");
  const hitterImg = loadImage("hitter_sprite.png");
  const fireImg = loadImage("fire_sprite.png");
  const isReady = (img) => img.complete && img.naturalWidth > 0;
  function drawHitter(lane, row, cx, cy, width) {
    const height = (width * HITTER.h) / HITTER.w;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(
      hitterImg,
      HITTER.x + SPRITE_COL[lane] * HITTER.w,
      HITTER.y + row * HITTER.h,
      HITTER.w,
      HITTER.h,
      cx - width / 2,
      cy - height / 2,
      width,
      height,
    );
    ctx.restore();
    return height;
  }
  function drawFire(frame, cx, baseY, width) {
    const height = (width * FIRE.h) / FIRE.w;
    ctx.drawImage(
      fireImg,
      frame * FIRE.w,
      0,
      FIRE.w,
      FIRE.h,
      cx - width / 2,
      baseY - height,
      width,
      height,
    );
  }
  function drawSprite(lane, row, cx, cy, width) {
    const height = (width * SPRITE_ART.h) / SPRITE_ART.w;
    ctx.drawImage(
      notesImg,
      SPRITE_COL[lane] * SPRITE_PITCH.x + SPRITE_ART.dx,
      row * SPRITE_PITCH.y + SPRITE_ART.dy,
      SPRITE_ART.w,
      SPRITE_ART.h,
      cx - width / 2,
      cy - height / 2,
      width,
      height,
    );
    return height;
  }
  let trackBounds = { center: 0, x: 0, width: 0, laneWidth: 0 };
  const multiplierColors = ["#aeb8c7", "#48d8c5", "#ffd43b", "#f05aa6"];

  function resize() {
    const width = Math.max(1, canvas.parentElement.clientWidth);
    const height = Math.max(1, canvas.parentElement.clientHeight);
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2,
      Math.sqrt(2_500_000 / (width * height)),
    );

    canvas.style.width = "100%";
    canvas.style.height = "100%";
    state.viewWidth = width;
    state.viewHeight = height;
    const trackWidth = width * (width <= 760 ? 1 : 0.5);
    trackBounds = {
      center: width / 2,
      x: (width - trackWidth) / 2,
      width: trackWidth,
      laneWidth: trackWidth / 5,
    };
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(performance.now());
  }

  function getTrackBounds() {
    return trackBounds;
  }

  function getLaneBounds(lane) {
    const track = getTrackBounds();
    return {
      center: track.x + (lane + 0.5) * track.laneWidth,
      width: track.laneWidth,
    };
  }

  function draw(now) {
    const width = state.viewWidth;
    const height = state.viewHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#080808";
    ctx.fillRect(0, 0, width, height);
    const { x: trackX, width: trackWidth, laneWidth } = getTrackBounds();
    const hitY = height - HIT_ZONE_OFFSET;
    const topY = Math.max(0, height * 0.05);
    const notesReady = isReady(notesImg);
    const spriteWidth = Math.min(laneWidth * 0.7, 80);

    ctx.fillStyle = "#000";
    ctx.fillRect(trackX, topY, trackWidth, height - topY);
    const fadeHeight = (height - topY) * 0.3;
    const laneLine = ctx.createLinearGradient(0, topY, 0, topY + fadeHeight);
    laneLine.addColorStop(0, "rgba(255,255,255,0)");
    laneLine.addColorStop(1, "rgba(255,255,255,.18)");
    for (let lane = 0; lane < 5; lane++) {
      const laneX = trackX + lane * laneWidth;
      ctx.fillStyle =
        lane % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.07)";
      ctx.fillRect(laneX, topY, laneWidth, height - topY);
      ctx.strokeStyle = laneLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laneX, topY);
      ctx.lineTo(laneX, height);
      ctx.stroke();
    }
    // Bordures latérales seulement, pas de bord supérieur.
    ctx.strokeStyle = "rgba(210,220,235,.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trackX, topY);
    ctx.lineTo(trackX, height);
    ctx.moveTo(trackX + trackWidth, topY);
    ctx.lineTo(trackX + trackWidth, height);
    ctx.stroke();

    if (state.running) {
      for (const beat of state.beats) {
        const y =
          ((now - (beat.hitAt - state.travelTime)) / state.travelTime) * hitY;
        if (y < topY || y > height) continue;
        ctx.strokeStyle = beat.strong
          ? "rgba(255,255,255,.4)"
          : "rgba(255,255,255,.14)";
        ctx.lineWidth = beat.strong ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(trackX, y);
        ctx.lineTo(trackX + trackWidth, y);
        ctx.stroke();
      }
    }

    // Le haut du highway se fond dans l'arrière-plan.
    const topFade = ctx.createLinearGradient(0, topY, 0, topY + fadeHeight);
    topFade.addColorStop(0, "#080808");
    topFade.addColorStop(1, "rgba(8,8,8,0)");
    ctx.fillStyle = topFade;
    ctx.fillRect(0, topY, width, fadeHeight);

    const { width: hitLaneWidth } = getLaneBounds(0);
    const targetRadius = Math.max(
      0,
      Math.min(TARGET_MAX_RADIUS, hitLaneWidth / 2 - 5),
    );

    for (let lane = 0; lane < 5; lane++) {
      const cx = trackX + (lane + 0.5) * laneWidth;
      const lit = state.heldLanes.includes(lane);
      if (isReady(hitterImg)) {
        const flash =
          now - state.fireAt[lane] < HIT_FLASH_MS ||
          state.notes.some((n) => n.lane === lane && n.holding);
        const hitterWidth = Math.min(laneWidth * 0.75, 90);
        drawHitter(lane, flash ? 2 : lit ? 1 : 0, cx, hitY, hitterWidth);
        ctx.save();
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#000";
        ctx.shadowBlur = 4;
        ctx.font = `bold ${Math.max(12, hitterWidth * 0.15)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(keys[lane].toUpperCase(), cx, hitY);
        ctx.restore();
        continue;
      }
      if (lit) {
        ctx.save();
        ctx.shadowColor = colors[lane];
        ctx.shadowBlur = 22;
        ctx.fillStyle = colors[lane];
        ctx.beginPath();
        ctx.arc(cx, hitY, targetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = colors[lane];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, hitY, targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = lit ? "#080808" : colors[lane];
      ctx.font = `bold ${Math.max(12, Math.min(18, targetRadius * 1.05))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(keys[lane].toUpperCase(), cx, hitY);
    }

    state.notes.forEach((note) => {
      const progress = Math.max(0, (now - note.spawnAt) / note.travelTime);
      const y = note.hitRegistered ? hitY : progress * hitY;
      const x = trackX + (note.lane + 0.5) * laneWidth;
      const radius = Math.max(0, Math.min(NOTE_MAX_RADIUS, laneWidth / 2 - 6));
      if (note.sustain > 0) {
        const sustainHeadY = Math.max(topY, y);
        const tailY = Math.max(
          topY,
          Math.min(
            sustainHeadY,
            note.hitRegistered
              ? hitY - ((note.sustainEndAt - now) / note.travelTime) * hitY
              : y - (note.sustain / (note.travelTime / 1000)) * hitY,
          ),
        );
        const tailHalfWidth = Math.max(
          2,
          notesReady ? spriteWidth * 0.07 : radius * 0.28,
        );
        const noteHalfWidth = tailHalfWidth;
        ctx.globalAlpha = note.releasedAt ? 0.22 : 0.55;
        ctx.fillStyle = colors[note.lane];
        ctx.beginPath();
        ctx.moveTo(x - tailHalfWidth, tailY);
        ctx.lineTo(x + tailHalfWidth, tailY);
        ctx.lineTo(x + noteHalfWidth, sustainHeadY);
        ctx.lineTo(x - noteHalfWidth, sustainHeadY);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      // Une note touchée n'a plus de tête : le hitter et le feu prennent le relais.
      if (note.hitRegistered) return;
      ctx.fillStyle = colors[note.lane];
      if (note.missed) ctx.globalAlpha = 0.3;
      if (notesReady) {
        const row = note.type === "tap" ? 2 : note.type === "hopo" ? 1 : 0;
        drawSprite(note.lane, row, x, y, spriteWidth);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      if (note.type === "hopo") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (note.type === "tap") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#080808";
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
    if (isReady(fireImg)) {
      const fireWidth = Math.min(laneWidth * 0.85, 100);
      for (let lane = 0; lane < 5; lane++) {
        const cx = trackX + (lane + 0.5) * laneWidth;
        const age = now - state.fireAt[lane];
        let frame = -1;
        if (state.notes.some((n) => n.lane === lane && n.holding)) {
          frame = FIRE.loop[Math.floor(now / FIRE.loopMs) % FIRE.loop.length];
        } else if (age >= 0 && age < FIRE.frames * FIRE.burstMs) {
          frame = Math.floor(age / FIRE.burstMs);
        }
        if (frame >= 0) drawFire(frame, cx, hitY, fireWidth);
      }
    }
    if (state.running) {
      const compactLayout = width <= 760;
      const hudX = compactLayout
        ? width * 0.04
        : trackX + trackWidth + width * 0.012;
      const hudWidth = compactLayout
        ? width * 0.58
        : Math.max(1, width - hudX - width * 0.05);
      const songProgress = Math.min(
        1,
        Math.max(0, (now - state.startedAt) / (state.chartDuration * 1000)),
      );
      const barY = height * (compactLayout ? 0.04 : 0.1);
      const barHeight = Math.max(6, height * 0.016);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hudX, barY, hudWidth, barHeight);
      ctx.fillStyle = "#ffd400";
      ctx.fillRect(hudX, barY, hudWidth * songProgress, barHeight);
      const presenceY = barY + barHeight + 5;
      const presenceHeight = Math.max(4, barHeight * 0.65);
      if (state.noFail) {
        ctx.fillStyle = "#c2bfae";
        ctx.font = `800 ${Math.max(10, barHeight * 1.2)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText("NO-FAIL", hudX, presenceY);
      } else {
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(hudX, presenceY, hudWidth, presenceHeight);
        ctx.fillStyle = "#ffd400";
        ctx.fillRect(
          hudX,
          presenceY,
          (hudWidth * Math.max(0, Math.min(100, state.stagePresence))) / 100,
          presenceHeight,
        );
      }

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${Math.max(14, Math.min(34, width * 0.035))}px sans-serif`;
      ctx.fillText(
        state.score.toLocaleString(),
        hudX + hudWidth,
        height * (compactLayout ? 0.13 : 0.19),
      );

      const multiplierProgress = state.multiplier === 4 ? 10 : state.combo % 10;
      const multiplierColor = multiplierColors[state.multiplier - 1];
      const segmentGap = 2;
      const orbRadius = Math.min(
        compactLayout ? 16 : 24,
        width * 0.045,
        height * 0.07,
      );
      const orbX = compactLayout
        ? width - orbRadius - width * 0.04
        : trackX + trackWidth;
      const segmentWidth = Math.min(8, Math.max(4, width * 0.012));
      const segmentHeight = compactLayout
        ? Math.max(2, Math.min(3, height * 0.006))
        : Math.max(3, Math.min(7, height * 0.012));
      const segmentsHeight = segmentHeight * 10 + segmentGap * 9;
      const orbY = compactLayout
        ? Math.max(orbRadius + 7 + segmentsHeight, height * 0.18)
        : (topY + height - HIT_ZONE_OFFSET) / 2;
      const segmentsX = orbX - segmentWidth / 2;
      const segmentsY = orbY - orbRadius - 5 - segmentsHeight;
      ctx.fillStyle = "#000";
      for (let i = 0; i < 10; i++) {
        ctx.fillRect(
          segmentsX,
          segmentsY + (9 - i) * (segmentHeight + segmentGap),
          segmentWidth,
          segmentHeight,
        );
      }
      ctx.fillStyle = multiplierColor;
      for (let i = 0; i < multiplierProgress; i++) {
        ctx.fillRect(
          segmentsX,
          segmentsY + (9 - i) * (segmentHeight + segmentGap),
          segmentWidth,
          segmentHeight,
        );
      }
      ctx.beginPath();
      ctx.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(12,8,20,.9)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = multiplierColor;
      ctx.stroke();
      ctx.fillStyle = multiplierColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${Math.max(10, orbRadius * 1.05)}px sans-serif`;
      ctx.fillText(`x${state.multiplier}`, orbX, orbY);
      const canvasLabel = `Web Hero. Score ${state.score}. Série ${state.combo}. Multiplicateur x${state.multiplier}. Progression ${Math.floor(songProgress * 100)}%. Stage presence ${state.stagePresence}%.`;
      if (canvas.getAttribute("aria-label") !== canvasLabel)
        canvas.setAttribute("aria-label", canvasLabel);
    }
    const flashRemaining = Math.max(0, state.missFlashUntil - now);
    if (flashRemaining > 0) {
      ctx.fillStyle = `rgba(220, 25, 35, ${0.3 * (flashRemaining / 180)})`;
      ctx.fillRect(0, 0, width, height);
    }
    let visibleParticles = 0;
    for (const particle of state.particles) {
      if (now - particle.createdAt < particle.duration)
        state.particles[visibleParticles++] = particle;
    }
    state.particles.length = visibleParticles;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const particle of state.particles) {
      const progress = Math.max(
        0,
        (now - particle.createdAt) / particle.duration,
      );
      const x = particle.x + particle.vx * progress;
      const y = particle.y + particle.vy * progress + progress * progress * 55;
      const radius = Math.max(0.8, particle.size * (1 - progress));
      ctx.globalAlpha = (1 - progress) ** 1.4;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      if (particle.fire) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(0.65 * (1 - progress * 0.45), 1.5);
        ctx.moveTo(0, radius);
        ctx.bezierCurveTo(
          -radius * 1.1,
          radius * 0.15,
          -radius * 0.2,
          -radius * 0.5,
          0,
          -radius,
        );
        ctx.bezierCurveTo(
          radius * 0.9,
          -radius * 0.2,
          radius * 0.8,
          radius * 0.4,
          0,
          radius,
        );
        ctx.fill();
        ctx.restore();
        continue;
      }
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const activePause = state.longPauses.find(
      (pause) => now >= pause.startAt && now < pause.endAt,
    );
    if (activePause) {
      const secondsUntilNextNote = Math.ceil(
        (activePause.nextNoteAt - now) / 1000,
      );
      const centerX = trackX + trackWidth / 2;
      const centerY = (topY + hitY) / 2;
      const panelWidth = Math.min(trackWidth * 0.72, 300);
      const panelHeight = Math.max(76, height * 0.19);
      ctx.fillStyle = "rgba(0,0,0,.82)";
      ctx.fillRect(
        centerX - panelWidth / 2,
        centerY - panelHeight / 2,
        panelWidth,
        panelHeight,
      );
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.max(12, Math.min(18, width * 0.022))}px sans-serif`;
      ctx.fillText("PROCHAINE NOTE", centerX, centerY - panelHeight * 0.22);
      ctx.fillStyle = "#ffd400";
      ctx.font = `800 ${Math.max(24, Math.min(48, width * 0.06))}px sans-serif`;
      ctx.fillText(
        `${secondsUntilNextNote}`,
        centerX,
        centerY + panelHeight * 0.2,
      );
    }
  }

  return { draw, getLaneBounds, getTrackBounds, resize };
}
