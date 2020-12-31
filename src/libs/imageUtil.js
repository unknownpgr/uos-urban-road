const TEXT_ALIGN = {
  CENTER: 1,
  LEFT: 2,
  RIGHT: 4,
  TOP: 8,
  BOTTOM: 16,
};

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawBoxedText(
  ctx,
  lines,
  x,
  y,
  horizontalAlign = TEXT_ALIGN.CENTER,
  verticalAlign = TEXT_ALIGN.BOTTOM,
  margin = 0.5,
  back = "#000",
  fore = "#fff"
) {
  // Calculate text width, height
  let width = 0;
  let height = 0;
  lines.forEach((line) => {
    let size = ctx.measureText(line);
    width = Math.max(width, size.width);
    height = Math.max(height, size.actualBoundingBoxAscent);
  });
  margin *= height;

  // 
  let realX = x;
  let realY = y;

  if (verticalAlign === TEXT_ALIGN.TOP) {
    realY = y - ((height + margin) * lines.length + margin);
  } else if (verticalAlign === TEXT_ALIGN.CENTER) {
    realY = y - ((height + margin) * lines.length + margin) / 2;
  }

  if (horizontalAlign === TEXT_ALIGN.LEFT) {
    realX = x - (width + margin * 2);
  } else if (horizontalAlign === TEXT_ALIGN.CENTER) {
    realX = x - (width + margin * 2) / 2;
  }

  // Draw box
  ctx.fillStyle = back;
  ctx.fillRect(
    realX,
    realY,
    width + margin * 2,
    (height + margin) * lines.length + margin
  );

  // Draw text
  ctx.fillStyle = fore;
  lines.forEach((line, i) => {
    ctx.fillText(line, realX + margin, realY + (margin + height) * (i + 1));
  });
}

function drawMarker(ctx, x, y, size = 5, label = null, back = '#000', fore = '#fff') {
  ctx.fillStyle = back;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size, y - size * 1.73);
  ctx.lineTo(x - size, y - size * 1.73);
  ctx.fill();

  if (label) {
    drawBoxedText(ctx, [label], x, y - size * 2, TEXT_ALIGN.CENTER, TEXT_ALIGN.TOP, 0.5, back, fore);
  }
}

export { loadImage, drawBoxedText, drawMarker, TEXT_ALIGN };