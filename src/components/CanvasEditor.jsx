import { useEffect, useRef, useCallback } from 'react'

const CANVAS_SIZE = 500
const HANDLE_RADIUS = 8
const HANDLE_HIT = 14

// Returns 8 handle positions [N, NE, E, SE, S, SW, W, NW]
function getHandles(cx, cy, r, shape) {
  if (shape === 'circle') {
    return [
      { x: cx,         y: cy - r },       // N
      { x: cx + r * 0.7071, y: cy - r * 0.7071 }, // NE
      { x: cx + r,     y: cy },           // E
      { x: cx + r * 0.7071, y: cy + r * 0.7071 }, // SE
      { x: cx,         y: cy + r },       // S
      { x: cx - r * 0.7071, y: cy + r * 0.7071 }, // SW
      { x: cx - r,     y: cy },           // W
      { x: cx - r * 0.7071, y: cy - r * 0.7071 }, // NW
    ]
  } else {
    // Square: r is half-size
    return [
      { x: cx,     y: cy - r },  // N
      { x: cx + r, y: cy - r },  // NE
      { x: cx + r, y: cy },      // E
      { x: cx + r, y: cy + r },  // SE
      { x: cx,     y: cy + r },  // S
      { x: cx - r, y: cy + r },  // SW
      { x: cx - r, y: cy },      // W
      { x: cx - r, y: cy - r },  // NW
    ]
  }
}

function hitTestHandles(px, py, handles) {
  for (let i = 0; i < handles.length; i++) {
    const h = handles[i]
    const dx = px - h.x
    const dy = py - h.y
    if (Math.sqrt(dx * dx + dy * dy) <= HANDLE_HIT) {
      return i
    }
  }
  return -1
}

function hitTestMask(px, py, cx, cy, r, shape) {
  if (shape === 'circle') {
    const dx = px - cx
    const dy = py - cy
    return Math.sqrt(dx * dx + dy * dy) <= r
  } else {
    return px >= cx - r && px <= cx + r && py >= cy - r && py <= cy + r
  }
}

// Compute the image's on-canvas letterboxed footprint (half-dimensions) at the
// current rotation. The image is drawn scaled-to-fit and centered at the canvas
// center, then rotated around that center.
function getImageBox(image) {
  const scale = Math.min(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height)
  return {
    halfW: (image.width * scale) / 2,
    halfH: (image.height * scale) / 2,
  }
}

// Clamp the mask (center + radius) so it stays inside the image's letterboxed
// footprint. We work in the image's rotated local frame: the footprint is an
// axis-aligned rectangle centered at the origin there, so clamping the mask's
// bounding half-extent (r) inside it is straightforward and rotation-correct.
function clampMaskToImage(cx, cy, r, image, rotation) {
  const center = CANVAS_SIZE / 2
  const { halfW, halfH } = getImageBox(image)

  // Radius can never exceed the image's half-extent in either axis.
  let clampedR = Math.min(r, halfW, halfH)
  clampedR = Math.max(20, clampedR)

  // Transform the mask center into the image's local (unrotated) frame.
  const theta = (rotation * Math.PI) / 180
  const cos = Math.cos(theta)
  const sin = Math.sin(theta)
  const dx = cx - center
  const dy = cy - center
  // Inverse rotation (rotate by -theta).
  const localX = dx * cos + dy * sin
  const localY = -dx * sin + dy * cos

  // Clamp so the mask's bounding box stays inside the footprint rectangle.
  const maxX = Math.max(0, halfW - clampedR)
  const maxY = Math.max(0, halfH - clampedR)
  const clampedLocalX = Math.max(-maxX, Math.min(maxX, localX))
  const clampedLocalY = Math.max(-maxY, Math.min(maxY, localY))

  // Transform back to canvas coordinates (rotate by +theta).
  const clampedX = center + clampedLocalX * cos - clampedLocalY * sin
  const clampedY = center + clampedLocalX * sin + clampedLocalY * cos

  return { pos: { x: clampedX, y: clampedY }, radius: clampedR }
}

export default function CanvasEditor({
  image,
  rotation,
  maskShape,
  maskPos,
  maskRadius,
  onMaskChange,
  allowOutsideBoundary = true,
}) {
  const canvasRef = useRef(null)
  const dragRef = useRef(null) // { type: 'mask'|'handle', handleIdx, startX, startY, startCx, startCy, startR }
  // Holds the single decoded HTMLImageElement so draw() never paints an unloaded image.
  const imgRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = CANVAS_SIZE
    const H = CANVAS_SIZE

    ctx.clearRect(0, 0, W, H)

    const cx = maskPos.x
    const cy = maskPos.y
    const r = maskRadius

    // Only paint the bitmap when we have a decoded image ready in the ref.
    // While decoding is pending imgRef.current is null and we fall through to
    // the checkerboard placeholder so no blank frame is shown mid-drag.
    if (image && imgRef.current) {
      const img = imgRef.current

      // Compute letterbox scale
      const scale = Math.min(W / image.width, H / image.height)
      const dw = image.width * scale
      const dh = image.height * scale

      ctx.save()
      ctx.translate(W / 2, H / 2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      ctx.restore()
    } else {
      // Checkerboard background when no image
      const size = 20
      for (let row = 0; row < H / size; row++) {
        for (let col = 0; col < W / size; col++) {
          ctx.fillStyle = (row + col) % 2 === 0 ? '#1e2a4a' : '#16213e'
          ctx.fillRect(col * size, row * size, size, size)
        }
      }
    }

    // Draw dark overlay using even-odd fill rule
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.beginPath()
    // Outer rectangle (entire canvas)
    ctx.rect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    // Inner shape (cut out) — must be wound in the opposite direction
    if (maskShape === 'circle') {
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true) // anticlockwise = true
    } else {
      // Square (anticlockwise)
      ctx.moveTo(cx + r, cy - r)
      ctx.lineTo(cx - r, cy - r)
      ctx.lineTo(cx - r, cy + r)
      ctx.lineTo(cx + r, cy + r)
      ctx.closePath()
    }
    ctx.fill('evenodd')
    ctx.restore()

    // Draw bright border around mask edge
    ctx.save()
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 2.5
    if (maskShape === 'circle') {
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.strokeRect(cx - r, cy - r, r * 2, r * 2)
    }
    ctx.restore()

    // Draw 8 resize handles
    const handles = getHandles(cx, cy, r, maskShape)
    handles.forEach((h) => {
      ctx.save()
      ctx.fillStyle = '#4a90d9'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(h.x, h.y, HANDLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    })
  }, [image, rotation, maskShape, maskPos, maskRadius])

  // Keep a stable reference to the latest draw() so the decode effect can call it
  // on load without listing draw as a dependency (which would re-run the decode
  // and rebuild an Image on every prop change).
  const drawRef = useRef(draw)
  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  // Decode the image exactly once when its source changes and store the ready
  // bitmap in a ref. This is the only place an Image is constructed; draw() reads
  // the guaranteed-decoded bitmap from imgRef, so no frame paints an unloaded image.
  useEffect(() => {
    if (!image) {
      // Reset so the placeholder checkerboard shows again when image is cleared.
      imgRef.current = null
      drawRef.current()
      return
    }

    // Clear the previous decoded bitmap so a redraw during the swap window shows
    // the checkerboard placeholder instead of the stale old image against the new mask.
    imgRef.current = null

    let cancelled = false
    const img = new window.Image()
    img.onload = () => {
      if (cancelled) return
      imgRef.current = img
      drawRef.current()
    }
    img.src = image.dataUrl

    return () => {
      cancelled = true
    }
  }, [image])

  // Redraw whenever mask/rotation props change. No Image is ever constructed here;
  // the bitmap is already decoded in imgRef.
  useEffect(() => {
    draw()
  }, [rotation, maskShape, maskPos, maskRadius, draw])

  function getCanvasPoint(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = CANVAS_SIZE / rect.width
    const scaleY = CANVAS_SIZE / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function handlePointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    const pt = getCanvasPoint(e)
    const handles = getHandles(maskPos.x, maskPos.y, maskRadius, maskShape)
    const handleIdx = hitTestHandles(pt.x, pt.y, handles)
    if (handleIdx >= 0) {
      dragRef.current = {
        type: 'handle',
        handleIdx,
        startCx: maskPos.x,
        startCy: maskPos.y,
        startR: maskRadius,
      }
    } else if (hitTestMask(pt.x, pt.y, maskPos.x, maskPos.y, maskRadius, maskShape)) {
      dragRef.current = {
        type: 'mask',
        startX: pt.x,
        startY: pt.y,
        startCx: maskPos.x,
        startCy: maskPos.y,
      }
    }
  }

  function emitMaskChange(pos, radius) {
    // When cropping outside the image is disabled, keep the mask within the
    // image's on-canvas footprint. Only constrain once an image is loaded.
    if (!allowOutsideBoundary && image) {
      const clamped = clampMaskToImage(pos.x, pos.y, radius, image, rotation)
      onMaskChange(clamped.pos, clamped.radius)
    } else {
      onMaskChange(pos, radius)
    }
  }

  function handlePointerMove(e) {
    const drag = dragRef.current
    if (!drag) return
    const pt = getCanvasPoint(e)

    if (drag.type === 'mask') {
      const dx = pt.x - drag.startX
      const dy = pt.y - drag.startY
      const newX = drag.startCx + dx
      const newY = drag.startCy + dy
      emitMaskChange({ x: newX, y: newY }, maskRadius)
    } else if (drag.type === 'handle') {
      // Radius = distance from mask center to pointer
      const dx = pt.x - drag.startCx
      const dy = pt.y - drag.startCy
      let newR = Math.sqrt(dx * dx + dy * dy)
      newR = Math.max(20, newR)
      emitMaskChange(maskPos, newR)
    }
  }

  function handlePointerUp() {
    dragRef.current = null
  }

  return (
    <div className="canvas-editor-wrap">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ width: CANVAS_SIZE, height: CANVAS_SIZE, maxWidth: '100%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  )
}

export { CANVAS_SIZE }
