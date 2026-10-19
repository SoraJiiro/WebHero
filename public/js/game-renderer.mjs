export function createGameRenderer({ canvas, state, keys, colors }) {
  const ctx = canvas.getContext("2d");
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
    const trackWidth = width * 0.68;
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
    const hitY = height - 48;
    const topY = Math.max(0, height * 0.05);

    ctx.fillStyle = "#000";
    ctx.fillRect(trackX, topY, trackWidth, height - topY);
    for (let lane = 0; lane < 5; lane++) {
      const laneX = trackX + lane * laneWidth;
      ctx.fillStyle =
        lane % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.07)";
      ctx.fillRect(laneX, topY, laneWidth, height - topY);
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(laneX, topY);
      ctx.lineTo(laneX, height);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(210,220,235,.48)";
    ctx.lineWidth = 3;
    ctx.strokeRect(trackX, topY, trackWidth, height - topY);

    const { width: hitLaneWidth } = getLaneBounds(0);
    const targetRadius = Math.max(0, Math.min(24, hitLaneWidth / 2 - 5));

    for (let lane = 0; lane < 5; lane++) {
      const cx = trackX + (lane + 0.5) * laneWidth;
      ctx.strokeStyle = colors[lane];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, hitY, targetRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = colors[lane];
      ctx.font = `bold ${Math.max(12, Math.min(18, targetRadius * 1.05))}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(keys[lane].toUpperCase(), cx, hitY);
    }

    state.notes.forEach((note) => {
      const progress = Math.max(0, (now - note.spawnAt) / note.travelTime);
      const y = note.hitRegistered ? hitY : progress * hitY;
      const x = trackX + (note.lane + 0.5) * laneWidth;
      const radius = Math.max(0, Math.min(20, laneWidth / 2 - 6));
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
        const tailHalfWidth = Math.max(2, radius * 0.28);
        const noteHalfWidth = Math.max(2, radius * 0.28);
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
      ctx.fillStyle = colors[note.lane];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    if (state.running) {
      const hudX = trackX + trackWidth + width * 0.012;
      const hudWidth = Math.max(1, width - hudX - width * 0.05);
      const songProgress = Math.min(
        1,
        Math.max(0, (now - state.startedAt) / (state.chartDuration * 1000)),
      );
      const barY = height * 0.1;
      const barHeight = Math.max(6, height * 0.016);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hudX, barY, hudWidth, barHeight);
      ctx.fillStyle = "#ffd400";
      ctx.fillRect(hudX, barY, hudWidth * songProgress, barHeight);
      const presenceY = barY + barHeight + 5;
      const presenceHeight = Math.max(4, barHeight * 0.65);
      ctx.fillStyle = "rgba(255,255,255,.22)";
      ctx.fillRect(hudX, presenceY, hudWidth, presenceHeight);
      ctx.fillStyle = "#ffd400";
      ctx.fillRect(
        hudX,
        presenceY,
        (hudWidth * Math.max(0, Math.min(100, state.stagePresence))) / 100,
        presenceHeight,
      );

      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = `800 ${Math.max(14, Math.min(34, width * 0.035))}px sans-serif`;
      ctx.fillText(
        state.score.toLocaleString(),
        hudX + hudWidth,
        height * 0.19,
      );

      const multiplierProgress = state.multiplier === 4 ? 10 : state.combo % 10;
      const multiplierColor = multiplierColors[state.multiplier - 1];
      const segmentGap = 2;
      const orbRadius = Math.min(24, width * 0.045, height * 0.07);
      const orbX = trackX + trackWidth;
      const orbY = (topY + height - 48) / 2;
      const segmentWidth = Math.min(8, Math.max(4, width * 0.012));
      const segmentHeight = Math.max(3, Math.min(7, height * 0.012));
      const segmentsHeight = segmentHeight * 10 + segmentGap * 9;
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
      const y = particle.y + particle.vy * progress + progress * progress * 35;
      const radius = Math.max(2.5, particle.size * (1 - progress * 0.35));
      ctx.globalAlpha = Math.max(0.35, 1 - progress);
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
