export default function Controls({
  rotation,
  onRotationChange,
  maskShape,
  onMaskShapeChange,
  allowOutsideBoundary,
  onAllowOutsideBoundaryChange,
  onDownload,
  hasImage,
}) {
  return (
    <div className="editor-panel controls-panel">
      <h2>Controls</h2>

      <div className="control-group">
        <label>
          Rotation <span className="value-display">{rotation}°</span>
        </label>
        <div className="rotation-row">
          <input
            type="range"
            min={0}
            max={360}
            step={1}
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="control-group">
        <label>Mask Shape</label>
        <div className="shape-toggle">
          <button
            className={maskShape === 'circle' ? 'active' : ''}
            onClick={() => onMaskShapeChange('circle')}
          >
            Circle
          </button>
          <button
            className={maskShape === 'square' ? 'active' : ''}
            onClick={() => onMaskShapeChange('square')}
          >
            Square
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>Boundary</label>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={allowOutsideBoundary}
            onChange={(e) => onAllowOutsideBoundaryChange(e.target.checked)}
          />
          <span>Allow cropping outside the image boundary</span>
        </label>
      </div>

      <button className="download-btn" onClick={onDownload} disabled={!hasImage}>
        Download PNG
      </button>
    </div>
  )
}
