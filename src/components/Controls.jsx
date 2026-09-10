export default function Controls({
  rotation,
  onRotationChange,
  maskShape,
  onMaskShapeChange,
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

      <button className="download-btn" onClick={onDownload} disabled={!hasImage}>
        Download PNG
      </button>
    </div>
  )
}
