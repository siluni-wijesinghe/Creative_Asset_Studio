import { useRef, useState } from "react";
import {
  DEFAULT_LOGO_PLACEMENT,
  MIN_LOGO_WIDTH,
  clamp,
  fitInside,
} from "../utils/logoPlacement";
import SecondaryButton from "./SecondaryButton";

// Position and mouse cursor for each corner handle.
// The class names are written out in full so Tailwind can find them
// (Tailwind can't see class names built by joining pieces of text).
const HANDLE_CLASSES = {
  tl: "-left-1.5 -top-1.5 cursor-nwse-resize",
  tr: "-right-1.5 -top-1.5 cursor-nesw-resize",
  bl: "-bottom-1.5 -left-1.5 cursor-nesw-resize",
  br: "-bottom-1.5 -right-1.5 cursor-nwse-resize",
};

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
    <div className="mt-3 rounded-2xl border-[1.5px] border-stone-200 bg-white p-4">
      {/* Choose which platform shape to preview */}
      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[13px] text-stone-500">Preview shape</span>
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 text-[13px] transition-colors ${
              p.id === shape.id
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
            }`}
            onClick={() => setShapeId(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* The frame has the same shape as the output image */}
      <div
        ref={frameRef}
        className="relative mx-auto w-full max-w-[440px] rounded-lg bg-stone-100"
        style={{ aspectRatio: `${shape.width} / ${shape.height}` }}
      >
        <img
          className="pointer-events-none absolute inset-0 h-full w-full select-none rounded-lg object-cover"
          src={productUrl}
          alt="Product preview"
          draggable={false}
        />

        {/* The logo box. Its position and size are percentages of the frame,
            so they stay inline styles (they change while dragging). */}
        <div
          className="absolute cursor-move touch-none select-none shadow-[0_0_0_1px_#fff,0_0_0_2px_#1c1917]"
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
            className="pointer-events-none block h-auto w-full"
            src={logoUrl}
            alt="Logo"
            draggable={false}
            onLoad={(e) => setLogoAspect(e.target.naturalHeight / e.target.naturalWidth)}
          />

          {/* Four corner handles */}
          {Object.keys(HANDLE_CLASSES).map((corner) => (
            <div
              key={corner}
              className={`absolute size-3 touch-none rounded-[3px] border-2 border-stone-900 bg-white ${HANDLE_CLASSES[corner]}`}
              onPointerDown={(e) => startResize(e, corner)}
            />
          ))}
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-4">
        <p className="flex-1 text-sm text-stone-500">
          Drag the logo to move it, or a corner to resize. Every platform uses the same placement.
        </p>
        <SecondaryButton onClick={() => onChange(DEFAULT_LOGO_PLACEMENT)}>Reset</SecondaryButton>
      </div>
    </div>
  );
}

export default LogoEditor;