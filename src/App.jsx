import { useState, useCallback } from 'react'
import ImageUploader from './components/ImageUploader'
import CanvasEditor, { CANVAS_SIZE } from './components/CanvasEditor'
import Controls from './components/Controls'
import Preview from './components/Preview'
import './App.css'

const DEFAULT_RADIUS = CANVAS_SIZE * 0.35
const DEFAULT_POS = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 }
const DOWNLOAD_SIZE = 512

export default function App() {
  const [image, setImage] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [maskShape, setMaskShape] = useState('circle')
  const [maskPos, setMaskPos] = useState(DEFAULT_POS)
  const [maskRadius, setMaskRadius] = useState(DEFAULT_RADIUS)
  const [allowOutsideBoundary, setAllowOutsideBoundary] = useState(true)

  const handleImageLoad = useCallback((img) => {
    setImage(img)
    setRotation(0)
    setMaskPos(DEFAULT_POS)
    setMaskRadius(DEFAULT_RADIUS)
  }, [])

  const handleMaskChange = useCallback((newPos, newRadius) => {
    setMaskPos(newPos)
    setMaskRadius(newRadius)
  }, [])

  const handleDownload = useCallback(() => {
    if (!image) return

    const img = new window.Image()
    img.onload = () => {
      const out = document.createElement('canvas')
      out.width = DOWNLOAD_SIZE
      out.height = DOWNLOAD_SIZE
      const ctx = out.getContext('2d')

      // Render the same letterboxed + rotated scene at DOWNLOAD_SIZE resolution,
      // then extract the mask region.
      const upscale = DOWNLOAD_SIZE / (maskRadius * 2)

      // Offscreen canvas that mirrors the editor's display coordinate space,
      // scaled up so the mask region fills DOWNLOAD_SIZE.
      const off = document.createElement('canvas')
      off.width = CANVAS_SIZE * upscale
      off.height = CANVAS_SIZE * upscale
      const offCtx = off.getContext('2d')

      const scale = Math.min(CANVAS_SIZE / image.width, CANVAS_SIZE / image.height)
      const dw = image.width * scale
      const dh = image.height * scale

      offCtx.save()
      offCtx.translate((CANVAS_SIZE * upscale) / 2, (CANVAS_SIZE * upscale) / 2)
      offCtx.rotate((rotation * Math.PI) / 180)
      offCtx.drawImage(
        img,
        (-dw / 2) * upscale,
        (-dh / 2) * upscale,
        dw * upscale,
        dh * upscale
      )
      offCtx.restore()

      const sx = (maskPos.x - maskRadius) * upscale
      const sy = (maskPos.y - maskRadius) * upscale
      const sSize = maskRadius * 2 * upscale

      ctx.save()
      ctx.beginPath()
      if (maskShape === 'circle') {
        ctx.arc(DOWNLOAD_SIZE / 2, DOWNLOAD_SIZE / 2, DOWNLOAD_SIZE / 2, 0, Math.PI * 2)
      } else {
        ctx.rect(0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE)
      }
      ctx.clip()
      ctx.drawImage(off, sx, sy, sSize, sSize, 0, 0, DOWNLOAD_SIZE, DOWNLOAD_SIZE)
      ctx.restore()

      const dataUrl = out.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'profile.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
    img.src = image.dataUrl
  }, [image, rotation, maskShape, maskPos, maskRadius])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Profile Pic Maker</h1>
        <p>Upload or paste an image, crop and rotate it, then download your profile picture.</p>
      </header>

      <main className="app-main">
        {!image && (
          <div className="editor-panel">
            <h2>Upload</h2>
            <ImageUploader onImageLoad={handleImageLoad} />
          </div>
        )}

        {image && (
          <>
            <div className="editor-row">
              <div className="editor-panel">
                <h2>Editor</h2>
                <CanvasEditor
                  image={image}
                  rotation={rotation}
                  maskShape={maskShape}
                  maskPos={maskPos}
                  maskRadius={maskRadius}
                  onMaskChange={handleMaskChange}
                  allowOutsideBoundary={allowOutsideBoundary}
                />
              </div>

              <Preview
                image={image}
                rotation={rotation}
                maskShape={maskShape}
                maskPos={maskPos}
                maskRadius={maskRadius}
                canvasDisplaySize={CANVAS_SIZE}
              />
            </div>

            <div className="editor-row">
              <Controls
                rotation={rotation}
                onRotationChange={setRotation}
                maskShape={maskShape}
                onMaskShapeChange={setMaskShape}
                allowOutsideBoundary={allowOutsideBoundary}
                onAllowOutsideBoundaryChange={setAllowOutsideBoundary}
                onDownload={handleDownload}
                hasImage={!!image}
              />

              <div className="editor-panel">
                <h2>Change Image</h2>
                <ImageUploader onImageLoad={handleImageLoad} />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
