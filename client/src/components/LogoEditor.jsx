import { useRef, useState } from "react";
import {
  DEFAULT_LOGO_PLACEMENT,
  MIN_LOGO_WIDTH,
  clamp,
  fitInside,
} from "../utils/logoPlacement";

// The product image with the logo on top. The user drags the logo to move it
// and drags a corner to resize it. App owns the placement; we report changes.
function LogoEditor({ productUrl, logoUrl, presets, placement, onChange }) {
  const frameRef = useRef(null); // the preview box, so we can measure it
  const dragRef = useRef(null);  // remembers what is being dragged right now

  const [shapeId, setShapeId] = useState(presets[0].id); // which shape to preview
  const [logoAspect, setLogoAspect] = useState(1);       // logo height / width

  // Work out the frame shape and where the logo sits inside it
  const shape = presets.find((p) => p.id === shapeId) || presets[0];
  const heightPerWidth = logoAspect * (shape.width / shape.height);
  const shown = fitInside(placement, heightPerWidth);

  // Turn a mouse/finger position into fractions of the frame (0 to 1)
  function pointerToFraction(event) {
    const rect = frameRef.current.getBoundingClientRect();
    return {
      px: (event.clientX - rect.left) / rect.width,
      py: (event.clientY - rect.top) / rect.height,
    };
  }

  // Pressed on the logo itself: start moving
  function startMove(event) {
    event.currentTarget.setPointerCapture(event.pointerId); // keep receiving moves
    const { px, py } = pointerToFraction(event);
    // Remember where inside the logo we grabbed it
    dragRef.current = { mode: "move", offsetX: px - shown.x, offsetY: py - shown.y };
  }

  // Pressed on a corner handle: start resizing
  function startResize(event, corner) {
    event.stopPropagation(); // don't also start a move
    event.currentTarget.setPointerCapture(event.pointerId);

    // The corner opposite to the one we grab stays fixed
    const height = shown.width * heightPerWidth;
    const anchors = {
      br: { x: shown.x, y: shown.y },
      bl: { x: shown.x + shown.width, y: shown.y },
      tr: { x: shown.x, y: shown.y + height },
      tl: { x: shown.x + shown.width, y: shown.y + height },
    };
    dragRef.current = { mode: "resize", corner, anchor: anchors[corner] };
  }

  function handleMove(event) {
    const drag = dragRef.current;
    if (!drag) return; // nothing is being dragged
    const { px, py } = pointerToFraction(event);

    if (drag.mode === "move") {
      onChange(
        fitInside({ ...shown, x: px - drag.offsetX, y: py - drag.offsetY }, heightPerWidth)
      );
      return;
    }

    // Resizing: the new width is the horizontal distance to the fixed corner.
    // The height follows automatically, so the logo never gets stretched.
    const { corner, anchor } = drag;
    const draggingRight = corner === "br" || corner === "tr";
    const draggingDown = corner === "br" || corner === "bl";

    const rawWidth = draggingRight ? px - anchor.x : anchor.x - px;

    // The logo may not grow past the edges of the frame
    const maxByX = draggingRight ? 1 - anchor.x : anchor.x;
    const maxByY = (draggingDown ? 1 - anchor.y : anchor.y) / heightPerWidth;
    const width = clamp(rawWidth, MIN_LOGO_WIDTH, Math.min(maxByX, maxByY));
    const height = width * heightPerWidth;

    onChange({
      width,
      x: draggingRight ? anchor.x : anchor.x - width,
      y: draggingDown ? anchor.y : anchor.y - height,
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  return (
    <div className="editor">
      {/* Choose which platform shape to preview */}
      <div className="shape-chips">
        <span className="editor-label">Preview shape</span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`chip ${p.id === shape.id ? "active" : ""}`}
            onClick={() => setShapeId(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* The frame has the same shape as the output image */}
      <div
        ref={frameRef}
        className="editor-frame"
        style={{ aspectRatio: `${shape.width} / ${shape.height}` }}
      >
        <img className="editor-image" src={productUrl} alt="Product preview" draggable={false} />

        {/* The logo box. Its position and size are percentages of the frame. */}
        <div
          className="logo-overlay"
          style={{
            left: `${shown.x * 100}%`,
            top: `${shown.y * 100}%`,
            width: `${shown.width * 100}%`,
          }}
          onPointerDown={startMove}
          onPointerMove={handleMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={logoUrl}
            alt="Logo"
            draggable={false}
            onLoad={(e) => setLogoAspect(e.target.naturalHeight / e.target.naturalWidth)}
          />

          {/* Four corner handles */}
          {["tl", "tr", "bl", "br"].map((corner) => (
            <div
              key={corner}
              className={`handle handle-${corner}`}
              onPointerDown={(e) => startResize(e, corner)}
            />
          ))}
        </div>
      </div>

      <div className="editor-footer">
        <p className="file-meta">
          Drag the logo to move it, or a corner to resize. Every platform uses the same placement.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onChange(DEFAULT_LOGO_PLACEMENT)}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default LogoEditor;