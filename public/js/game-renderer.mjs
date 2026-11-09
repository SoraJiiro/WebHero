import { getFullComboStatus } from "./utils.js";
import { formatNumber, t } from "./i18n.mjs";

export const HIT_ZONE_OFFSET = 90;
export const HIT_ZONE_HEIGHT_RATIO = 0.18;
export const TARGET_MAX_RADIUS = 30;
export const NOTE_MAX_RADIUS = 26;

// Feuille de sprites : colonnes vert/rouge/jaune/bleu/orange ; lignes 0 note, 1 lumineuse, 2 vitre.
const SPRITE_COL = [0, 1, 2, 3, 4];
const SPRITE_PITCH = { x: 100, y: 500 / 6 };
const SPRITE_ART = { dx: 1, dy: 1, w: 98, h: 500 / 6 - 2 };
const STAR_POWER_COL = { strum: 0, hopo: 1, tap: 2 };
const STAR_POWER_ROW = 3;
const STAR_POWER_ACTIVE_ROW = 5;

const HITTER = {
  columnX: [30, 338.75, 628, 921.75, 1215],
  rowY: [12, 340, 650],
  rowH: [289, 289, 320],
  centerY: [168, 163, 165],
  w: 291.5,
  h: 289,
};
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
const HIGHWAY_IMAGE_SLICES = 32;

export function createGameRenderer({ canvas, state, colors }) {
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
  let highwayImage = null;
  let highwayImageSource = "";
  const isReady = (img) => img?.complete && img.naturalWidth > 0;
  function drawHitter(lane, row, cx, cy, width) {
    const sourceHeight = HITTER.rowH[row];
    const height = (width * sourceHeight) / HITTER.w;
    const scale = width / HITTER.w;
    const centerOffset = (HITTER.centerY[row] - sourceHeight / 2) * scale;
    ctx.save();
    ctx.globalCompositeOperation = state.highwayBackground
      ? "source-over"
      : "lighter";
    ctx.drawImage(
      hitterImg,
      HITTER.columnX[lane],
      HITTER.rowY[row],
      HITTER.w,
      sourceHeight,
      cx - width / 2,
      cy - height / 2 - centerOffset,
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
  function drawSprite(lane, row, cx, cy, width, height) {
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
  function drawStarPowerSprite(type, cx, cy, width, height) {
    ctx.drawImage(
      notesImg,
      (STAR_POWER_COL[type] ?? 0) * SPRITE_PITCH.x + SPRITE_ART.dx,
      STAR_POWER_ACTIVE_ROW * SPRITE_PITCH.y + SPRITE_ART.dy,
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
    const topScale = 0.82;
    const perspectiveAt = (y) =>
      Math.max(0.01, topScale + (1 - topScale) * (y / Math.max(1, hitY)));
    const laneCenterAt = (lane, y) =>
      width / 2 +
      (trackX + (lane + 0.5) * laneWidth - width / 2) * perspectiveAt(y);
    const trackEdgeAt = (edge, y) =>
      width / 2 + (edge - width / 2) * perspectiveAt(y);
    const notesReady = isReady(notesImg);
    const starPowerActive =
      state.running && !state.practiceRange && state.starPowerActiveUntil > now;
    const noteSize = state.noteSize ?? 1;
    const spriteWidth = Math.min(laneWidth * 0.7, 80) * noteSize;

    if (state.highwayBackground !== highwayImageSource) {
      highwayImageSource = state.highwayBackground;
      highwayImage = null;
      if (highwayImageSource) {
        highwayImage = new Image();
        highwayImage.onload = () => draw(performance.now());
        highwayImage.src = highwayImageSource;
      }
    }

    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(trackEdgeAt(trackX, topY), topY);
    ctx.lineTo(trackEdgeAt(trackX + trackWidth, topY), topY);
    ctx.lineTo(trackEdgeAt(trackX + trackWidth, height), height);
    ctx.lineTo(trackEdgeAt(trackX, height), height);
    ctx.closePath();
    ctx.fill();
    if (isReady(highwayImage)) {
      const scale = Math.max(
        trackWidth / highwayImage.naturalWidth,
        (height - topY) / highwayImage.naturalHeight,
      );
      const imageWidth = highwayImage.naturalWidth * scale;
      const imageHeight = highwayImage.naturalHeight * scale;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(trackEdgeAt(trackX, topY), topY);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, topY), topY);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, height), height);
      ctx.lineTo(trackEdgeAt(trackX, height), height);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = 0.48;
      const scrollStartAt = state.startedAt - state.travelTime;
      const scrollDistance = state.running
        ? ((Math.max(0, now - scrollStartAt) / state.travelTime) * hitY) %
          (imageHeight * 2)
        : 0;
      const tileShift = Math.floor(scrollDistance / imageHeight);
      const tileOffset = scrollDistance % imageHeight;
      const imageX = trackX + (trackWidth - imageWidth) / 2;
      const imageTop = topY + (height - topY - imageHeight) / 2;
      for (
        let tile = -1, imageY = imageTop + tileOffset - imageHeight;
        imageY < height;
        tile++, imageY += imageHeight
      ) {
        const mirrored = Math.abs((tile - tileShift) % 2) === 1;
        const sourceSliceHeight =
          highwayImage.naturalHeight / HIGHWAY_IMAGE_SLICES;
        const sliceHeight = imageHeight / HIGHWAY_IMAGE_SLICES;
        for (let slice = 0; slice < HIGHWAY_IMAGE_SLICES; slice++) {
          const sliceY = imageY + slice * sliceHeight;
          const slicePerspective = perspectiveAt(sliceY + sliceHeight / 2);
          ctx.save();
          ctx.translate(width / 2, 0);
          ctx.scale(slicePerspective, 1);
          ctx.translate(-width / 2, 0);
          if (mirrored) {
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(
            highwayImage,
            0,
            slice * sourceSliceHeight,
            highwayImage.naturalWidth,
            sourceSliceHeight,
            imageX,
            sliceY,
            imageWidth,
            sliceHeight,
          );
          ctx.restore();
        }
      }
      ctx.restore();
    }
    if (starPowerActive) {
      const pulse = 0.13 + (Math.sin(now / 260) + 1) * 0.035;
      const tint = ctx.createLinearGradient(0, topY, 0, height);
      tint.addColorStop(0, `rgba(24,125,255,${pulse * 0.45})`);
      tint.addColorStop(1, `rgba(16,115,255,${pulse})`);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(trackEdgeAt(trackX, topY), topY);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, topY), topY);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, height), height);
      ctx.lineTo(trackEdgeAt(trackX, height), height);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = tint;
      ctx.fillRect(0, topY, width, height - topY);
      ctx.restore();
    }
    const fadeHeight = (height - topY) * 0.3;
    const laneLine = ctx.createLinearGradient(0, topY, 0, topY + fadeHeight);
    laneLine.addColorStop(0, "rgba(255,255,255,0)");
    laneLine.addColorStop(1, "rgba(255,255,255,.18)");
    for (let lane = 0; lane < 5; lane++) {
      const leftTop = trackEdgeAt(trackX + lane * laneWidth, topY);
      const rightTop = trackEdgeAt(trackX + (lane + 1) * laneWidth, topY);
      const leftBottom = trackEdgeAt(trackX + lane * laneWidth, height);
      const rightBottom = trackEdgeAt(trackX + (lane + 1) * laneWidth, height);
      ctx.fillStyle =
        lane % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.07)";
      ctx.beginPath();
      ctx.moveTo(leftTop, topY);
      ctx.lineTo(rightTop, topY);
      ctx.lineTo(rightBottom, height);
      ctx.lineTo(leftBottom, height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = laneLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(leftTop, topY);
      ctx.lineTo(leftBottom, height);
      ctx.stroke();
    }
    const laneDividerStartY = height - (height - topY) * 0.35;
    ctx.strokeStyle = "rgba(255,255,255,.2)";
    ctx.lineWidth = 2;
    for (let lane = 1; lane < 5; lane++) {
      const x = trackX + lane * laneWidth;
      ctx.beginPath();
      ctx.moveTo(trackEdgeAt(x, laneDividerStartY), laneDividerStartY);
      ctx.lineTo(trackEdgeAt(x, height), height);
      ctx.stroke();
    }
    // Bordures latérales seulement, pas de bord supérieur.
    ctx.strokeStyle = "rgba(210,220,235,.48)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trackEdgeAt(trackX, topY), topY);
    ctx.lineTo(trackEdgeAt(trackX, height), height);
    ctx.moveTo(trackEdgeAt(trackX + trackWidth, topY), topY);
    ctx.lineTo(trackEdgeAt(trackX + trackWidth, height), height);
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
        ctx.moveTo(trackEdgeAt(trackX, y), y);
        ctx.lineTo(trackEdgeAt(trackX + trackWidth, y), y);
        ctx.stroke();
      }
    }

    // Le haut du highway se fond dans l'arrière-plan.
    const topFade = ctx.createLinearGradient(0, topY, 0, topY + fadeHeight);
    topFade.addColorStop(0, "#080808");
    topFade.addColorStop(1, "rgba(8,8,8,0)");
    ctx.fillStyle = topFade;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(trackEdgeAt(trackX, topY), topY);
    ctx.lineTo(trackEdgeAt(trackX + trackWidth, topY), topY);
    ctx.lineTo(
      trackEdgeAt(trackX + trackWidth, topY + fadeHeight),
      topY + fadeHeight,
    );
    ctx.lineTo(trackEdgeAt(trackX, topY + fadeHeight), topY + fadeHeight);
    ctx.closePath();
    ctx.clip();
    ctx.fillRect(0, topY, width, fadeHeight);
    ctx.restore();

    if (state.hitZonePreview) {
      const hitZoneHalfHeight = ((height - topY) * HIT_ZONE_HEIGHT_RATIO) / 2;
      const calibrationMs = state.audioDelay + state.videoDelay;
      const calibratedY = Math.max(
        topY + hitZoneHalfHeight,
        Math.min(
          height - hitZoneHalfHeight,
          hitY + (calibrationMs / Math.max(1, state.travelTime)) * hitY,
        ),
      );
      const hitZoneTop = calibratedY - hitZoneHalfHeight;
      const hitZoneBottom = calibratedY + hitZoneHalfHeight;
      ctx.fillStyle = "rgba(255,255,255,.08)";
      ctx.beginPath();
      ctx.moveTo(trackEdgeAt(trackX, hitZoneTop), hitZoneTop);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, hitZoneTop), hitZoneTop);
      ctx.lineTo(
        trackEdgeAt(trackX + trackWidth, hitZoneBottom),
        hitZoneBottom,
      );
      ctx.lineTo(trackEdgeAt(trackX, hitZoneBottom), hitZoneBottom);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(trackEdgeAt(trackX, hitZoneTop), hitZoneTop);
      ctx.lineTo(trackEdgeAt(trackX + trackWidth, hitZoneTop), hitZoneTop);
      ctx.moveTo(trackEdgeAt(trackX, hitZoneBottom), hitZoneBottom);
      ctx.lineTo(
        trackEdgeAt(trackX + trackWidth, hitZoneBottom),
        hitZoneBottom,
      );
      ctx.stroke();
    }

    const { width: hitLaneWidth } = getLaneBounds(0);
    const targetRadius = Math.max(
      0,
      Math.min(TARGET_MAX_RADIUS, hitLaneWidth / 2 - 5),
    );

    for (let lane = 0; lane < 5; lane++) {
      const cx = laneCenterAt(lane, hitY);
      const laneBaseX = trackX + (lane + 0.5) * laneWidth;
      const laneAngle = Math.atan2(
        (laneBaseX - width / 2) * (1 - topScale),
        hitY,
      );
      const lit = state.heldLanes.includes(lane);
      ctx.save();
      ctx.translate(cx, hitY);
      ctx.rotate(-laneAngle);
      if (isReady(hitterImg)) {
        const flash =
          now - state.fireAt[lane] < HIT_FLASH_MS ||
          state.notes.some((n) => n.lane === lane && n.holding);
        const hitterWidth = Math.min(laneWidth * 0.75, 90);
        if (flash) {
          ctx.save();
          ctx.globalAlpha = 0.42;
          ctx.shadowColor = colors[lane];
          ctx.shadowBlur = 14;
          ctx.strokeStyle = colors[lane];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            hitterWidth * 0.43,
            hitterWidth * 0.34,
            0,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
          ctx.restore();
        }
        drawHitter(lane, flash ? 2 : lit ? 1 : 0, 0, 0, hitterWidth);
        ctx.restore();
        continue;
      }
      if (lit) {
        ctx.save();
        ctx.shadowColor = colors[lane];
        ctx.shadowBlur = 22;
        ctx.fillStyle = colors[lane];
        ctx.beginPath();
        ctx.arc(0, 0, targetRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.strokeStyle = colors[lane];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    state.notes.forEach((note) => {
      const progress = Math.max(0, (now - note.spawnAt) / note.travelTime);
      const y = note.hitRegistered ? hitY : progress * hitY;
      const projection = perspectiveAt(y);
      const x = laneCenterAt(note.lane, y);
      const radius =
        Math.max(0, Math.min(NOTE_MAX_RADIUS, laneWidth / 2 - 6)) * noteSize;
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
        const tailProjection = perspectiveAt(tailY);
        const headProjection = perspectiveAt(sustainHeadY);
        const tailBaseWidth = notesReady
          ? spriteWidth * 0.07
          : Math.min(NOTE_MAX_RADIUS, laneWidth / 2 - 6) * noteSize * 0.28;
        const tailHalfWidth = Math.max(2, tailBaseWidth * tailProjection);
        const noteHalfWidth = Math.max(2, tailBaseWidth * headProjection);
        const tailX = laneCenterAt(note.lane, tailY);
        const sustainHeadX = laneCenterAt(note.lane, sustainHeadY);
        ctx.globalAlpha = note.releasedAt ? 0.22 : 0.55;
        ctx.fillStyle = colors[note.lane];
        ctx.beginPath();
        ctx.moveTo(tailX - tailHalfWidth, tailY);
        ctx.lineTo(tailX + tailHalfWidth, tailY);
        ctx.lineTo(sustainHeadX + noteHalfWidth, sustainHeadY);
        ctx.lineTo(sustainHeadX - noteHalfWidth, sustainHeadY);
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
        const noteWidth = spriteWidth * projection;
        const noteHeight = (spriteWidth * SPRITE_ART.h) / SPRITE_ART.w;
        const phrase = state.starPowerPhrases?.find(
          ({ id }) => id === note.starPowerPhrase,
        );
        if (
          state.practiceRange ||
          note.starPowerPhrase === undefined ||
          phrase?.failed
        )
          drawSprite(note.lane, row, x, y, noteWidth, noteHeight);
        else if (!starPowerActive)
          drawSprite(note.lane, STAR_POWER_ROW, x, y, noteWidth, noteHeight);
        else drawStarPowerSprite(note.type, x, y, noteWidth, noteHeight);
        ctx.globalAlpha = 1;
        return;
      }
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(projection, 1);
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      if (note.type === "hopo") {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (note.type === "tap") {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = "#080808";
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    });
    if (isReady(fireImg)) {
      const fireWidth = Math.min(laneWidth * 0.75, 88);
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
        ? Math.max(1, Math.min(width * 0.58, width - hudX - 142))
        : Math.max(1, width - hudX - width * 0.05);
      const songProgress = Math.min(
        1,
        Math.max(0, (now - state.startedAt) / (state.chartDuration * 1000)),
      );
      const barY = height * (compactLayout ? 0.04 : 0.1);
      const barHeight = Math.max(6, height * 0.016);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hudX, barY, hudWidth, barHeight);
      ctx.fillStyle = state.primaryColor;
      ctx.fillRect(hudX, barY, hudWidth * songProgress, barHeight);
      const presenceY = barY + barHeight + 5;
      const presenceHeight = Math.max(4, barHeight * 0.65);
      if (state.noFail) {
        ctx.fillStyle = "#c2bfae";
        ctx.font = `800 ${Math.max(10, barHeight * 1.2)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(t("game.noFail"), hudX, presenceY);
      } else {
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(hudX, presenceY, hudWidth, presenceHeight);
        ctx.fillStyle = state.primaryColor;
        ctx.fillRect(
          hudX,
          presenceY,
          (hudWidth * Math.max(0, Math.min(100, state.stagePresence))) / 100,
          presenceHeight,
        );
      }
      const presenceContentHeight = state.noFail
        ? Math.max(presenceHeight, Math.max(10, barHeight * 1.2))
        : presenceHeight;
      const starPowerY = presenceY + presenceContentHeight + 5;
      const starPowerLabelWidth = Math.max(15, barHeight * 2.4);
      const starPowerBarWidth = Math.max(1, hudWidth - starPowerLabelWidth);
      const activeDuration =
        state.starPowerActiveUntil - state.starPowerActivatedAt;
      const activeCharge =
        starPowerActive && activeDuration > 0
          ? 50 *
            Math.max(0, (state.starPowerActiveUntil - now) / activeDuration)
          : 0;
      const shownStarPowerCharge = Math.min(
        100,
        state.starPowerCharge + activeCharge,
      );
      if (!state.practiceRange) {
        ctx.fillStyle = "rgba(255,255,255,.82)";
        ctx.font = `800 ${Math.max(9, barHeight)}px sans-serif`;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("SP", hudX, starPowerY + barHeight / 2);
        ctx.fillStyle = "rgba(255,255,255,.22)";
        ctx.fillRect(
          hudX + starPowerLabelWidth,
          starPowerY,
          starPowerBarWidth,
          barHeight,
        );
        ctx.fillStyle = starPowerActive ? "#fff27a" : "#69e5ff";
        ctx.fillRect(
          hudX + starPowerLabelWidth,
          starPowerY,
          (starPowerBarWidth * shownStarPowerCharge) / 100,
          barHeight,
        );
        if (starPowerActive) {
          ctx.strokeStyle = "#fff27a";
          ctx.lineWidth = 1;
          ctx.strokeRect(
            hudX + starPowerLabelWidth,
            starPowerY,
            starPowerBarWidth,
            barHeight,
          );
        }
      }

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      const scoreFontSize = Math.max(14, Math.min(34, width * 0.035));
      const scoreY = compactLayout
        ? Math.max(
            height * 0.13,
            starPowerY +
              (state.practiceRange ? 0 : barHeight) +
              5 +
              scoreFontSize / 2,
          )
        : height * 0.19;
      ctx.font = `800 ${scoreFontSize}px sans-serif`;
      ctx.fillText(formatNumber(state.score), hudX + hudWidth, scoreY);
      let practiceStatsLabel = "";
      if (state.practiceRange) {
        const accuracy =
          state.hits + state.misses
            ? Math.round((state.hits / (state.hits + state.misses)) * 100)
            : 100;
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(255,255,255,.82)";
        ctx.font = `700 ${Math.max(10, Math.min(15, width * 0.016))}px sans-serif`;
        ctx.fillText(
          `${accuracy}%  ${state.hits} ${t("game.hits")}  ${state.misses} ${t("game.miss")}`,
          hudX,
          compactLayout
            ? Math.max(height * 0.17, scoreY + scoreFontSize / 2 + 10)
            : height * 0.24,
        );
        practiceStatsLabel = t("game.accuracy", {
          accuracy,
          hits: state.hits,
          misses: state.misses,
        });
      }

      const multiplierProgress = state.multiplier === 4 ? 10 : state.combo % 10;
      const multiplierColor = multiplierColors[state.multiplier - 1];
      const shownMultiplier = state.multiplier * (starPowerActive ? 2 : 1);
      const displayedMultiplierColor = starPowerActive
        ? "#69e5ff"
        : multiplierColor;
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
      ctx.strokeStyle = displayedMultiplierColor;
      ctx.stroke();
      if (state.combo > 0 && getFullComboStatus(state) !== "broken") {
        ctx.save();
        ctx.globalAlpha = 0.72 + Math.sin(now / 140) * 0.18;
        ctx.strokeStyle = "#ffd400";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#ffd400";
        ctx.shadowBlur = 8;
        ctx.setLineDash([5, 4]);
        ctx.lineDashOffset = -(now / 35) % 9;
        ctx.beginPath();
        ctx.arc(orbX, orbY, orbRadius + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = displayedMultiplierColor;
      ctx.textAlign = "center";
      ctx.font = `bold ${Math.max(10, orbRadius * 1.05)}px sans-serif`;
      ctx.fillText(`x${shownMultiplier}`, orbX, orbY);
      const canvasLabel = t("game.canvasLabel", {
        score: formatNumber(state.score),
        practiceStatsLabel: practiceStatsLabel ? ` ${practiceStatsLabel}` : "",
        combo: state.combo,
        multiplier: shownMultiplier,
        starPower: state.practiceRange
          ? ""
          : t("game.starPower", {
              charge: Math.floor(shownStarPowerCharge),
              active: starPowerActive ? t("game.starPowerActive") : "",
            }),
        progress: Math.floor(songProgress * 100),
        stagePresence: t("game.stagePresence", {
          presence: state.stagePresence,
        }),
      });
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
      ctx.fillText(t("game.nextNote"), centerX, centerY - panelHeight * 0.22);
      ctx.fillStyle = state.primaryColor;
      ctx.font = `800 ${Math.max(24, Math.min(48, width * 0.06))}px sans-serif`;
      ctx.fillText(
        `${secondsUntilNextNote}`,
        centerX,
        centerY + panelHeight * 0.2,
      );
    }
    if (state.fadeAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${state.fadeAlpha})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  return { draw, getLaneBounds, getTrackBounds, resize };
}
