import { useEffect, useRef, useState } from 'react'

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve({ dataUrl: e.target.result, width: img.width, height: img.height })
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ImageUploader({ onImageLoad }) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            try {
              const result = await readFileAsDataURL(file)
              onImageLoad(result)
            } catch (err) {
              console.error('Failed to read pasted image', err)
            }
          }
          break
        }
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [onImageLoad])

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const result = await readFileAsDataURL(file)
      onImageLoad(result)
    } catch (err) {
      console.error('Failed to read file', err)
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave() {
    setDragOver(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const result = await readFileAsDataURL(file)
      onImageLoad(result)
    } catch (err) {
      console.error('Failed to read dropped file', err)
    }
  }

  function handleClick() {
    fileInputRef.current?.click()
  }

  return (
    <div
      className={`upload-zone${dragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <div className="upload-icon">🖼️</div>
      <div className="upload-title">Drop an image here</div>
      <div className="upload-sub">or paste from clipboard (Ctrl+V)</div>
      <button
        className="upload-btn"
        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}
      >
        Browse File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}
