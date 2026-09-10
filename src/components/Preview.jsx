import { useEffect, useRef } from 'react'

const PREVIEW_SIZE = 200

export default function Preview({
  image,
  rotation,
  maskShape,
  maskPos,
  maskRadius,
  canvasDisplaySize,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

    const img = new window.Image()
    img.onload = () => {
      // Offscreen canvas matching the displayed (letterboxed) coordinate space,
      // so mask coordinates map 1:1. We render the rotated image the same way
      // the editor does, at display resolution scaled up for crispness.
      const upscale = 2
      const displaySize = canvasDisplaySize
      const off = document.createElement('canvas')
      off.width = displaySize * upscale
      off.height = displaySize * upscale
      const offCtx = off.getContext('2d')

      // Match CanvasEditor letterbox math
      const scale = Math.min(displaySize / image.width, displaySize / image.height)
      const dw = image.width * scale
      const dh = image.height * scale

      offCtx.save()
      offCtx.translate((displaySize * upscale) / 2, (displaySize * upscale) / 2)
      offCtx.rotate((rotation * Math.PI) / 180)
      offCtx.drawImage(
        img,
        (-dw / 2) * upscale,
        (-dh / 2) * upscale,
        dw * upscale,
        dh * upscale
      )
      offCtx.restore()

      // Mask region in display coordinates
      const cx = maskPos.x
      const cy = maskPos.y
      const r = maskRadius

      // Source rectangle on the offscreen canvas (scaled by upscale)
      const sx = (cx - r) * upscale
      const sy = (cy - r) * upscale
      const sSize = r * 2 * upscale

      ctx.save()
      // Clip preview to shape
      ctx.beginPath()
      if (maskShape === 'circle') {
        ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, 0, Math.PI * 2)
      } else {
        ctx.rect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)
      }
      ctx.clip()
      ctx.drawImage(
        off,
        sx, sy, sSize, sSize,
        0, 0, PREVIEW_SIZE, PREVIEW_SIZE
      )
      ctx.restore()
    }
    img.src = image.dataUrl
  }, [image, rotation, maskShape, maskPos, maskRadius, canvasDisplaySize])

  return (
    <div className="editor-panel preview-panel">
      <h2>Preview</h2>
      {image ? (
        <>
          <canvas ref={canvasRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} />
          <div className="preview-label">Live crop preview</div>
        </>
      ) : (
        <div className="no-image-msg">Upload an image to see the preview</div>
      )}
    </div>
  )
}
