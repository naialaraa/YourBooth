import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import CanvasImage from '../CanvasImage.jsx'
import StickerEditor from '../StickerEditor/StickerEditor.jsx'
import FrameSelector from '../FrameSelector/FrameSelector.jsx'
import { DOODLE_COLORS } from '../../utils/constants.js'
import { buildStrip } from '../../utils/compositor.js'
import { downloadCanvas } from '../../utils/image.js'

// Unique id with a fallback for non-secure contexts where crypto.randomUUID is missing
const uid = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`

/**
 * Decorate the strip: pick a frame, free-hand doodle (with adjustable thickness),
 * add draggable text + emoji stickers, then flatten everything to one PNG.
 *
 * @param {object} props
 * @param {HTMLCanvasElement[]} props.photos  captured cells
 * @param {boolean} [props.vintage]
 * @param {Function} props.onRetake
 * @param {string}   [props.filename]
 */
export default function DoodleEditor({ photos, vintage = false, onRetake, filename = 'yourbooth.png' }) {
  const drawRef = useRef(null)
  const boxRef = useRef(null)
  const drawingRef = useRef(false)
  const strokesRef = useRef([]) // [{ color, width(norm), erase, points:[{x,y}(norm)] }]

  const [frameId, setFrameId] = useState('white')
  const [tool, setTool] = useState('pen')
  const [color, setColor] = useState('#FF8FB8')
  const [penSize, setPenSize] = useState(10) // display px
  const [strokeTick, setStrokeTick] = useState(0) // forces undo re-render
  const [stickers, setStickers] = useState([])
  const [texts, setTexts] = useState([])
  const [textInput, setTextInput] = useState('')
  const [selected, setSelected] = useState(null)
  const [boxW, setBoxW] = useState(0)
  const dragRef = useRef(null)
  const resizeRef = useRef(null)
  const rotateRef = useRef(null)

  // Compose the base strip from the chosen frame
  const baseCanvas = useMemo(() => {
    const noFrame = frameId === 'none'
    const frame = { white: { bg: '#FFFFFF', accent: '#111111' },
      pink: { bg: '#FF9EC4', accent: '#B23A6E' },
      black: { bg: '#111111', accent: '#FFFFFF' },
      purple: { bg: '#B7A0FF', accent: '#4B3692' },
      blue: { bg: '#8CCBFF', accent: '#235C8C' } }[frameId] ?? { bg: '#FFFFFF', accent: '#111111' }
    return buildStrip({ photos, frame, noFrame, vintage })
  }, [photos, frameId, vintage])

  // (Re)render the free-hand layer at the current base resolution
  const renderStrokes = () => {
    const c = drawRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    strokesRef.current.forEach((s) => {
      if (s.points.length === 0) return
      ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = s.color
      ctx.lineWidth = Math.max(1, s.width * c.width)
      ctx.beginPath()
      ctx.moveTo(s.points[0].x * c.width, s.points[0].y * c.height)
      s.points.forEach((p) => ctx.lineTo(p.x * c.width, p.y * c.height))
      if (s.points.length === 1) ctx.lineTo(s.points[0].x * c.width + 0.01, s.points[0].y * c.height)
      ctx.stroke()
    })
    ctx.globalCompositeOperation = 'source-over'
  }

  // keep the draw canvas sized to the base strip & replay strokes on any change
  useEffect(() => {
    const c = drawRef.current
    if (!c || !baseCanvas) return
    c.width = baseCanvas.width
    c.height = baseCanvas.height
    renderStrokes()
  }, [baseCanvas, strokeTick])

  // track the displayed width of the stage so text/sticker sizes are WYSIWYG
  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setBoxW(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [baseCanvas])

  const norm = (e) => {
    const rect = drawRef.current.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }

  const startDraw = (e) => {
    if (e.target !== drawRef.current) return
    e.preventDefault()
    drawingRef.current = true
    const rect = drawRef.current.getBoundingClientRect()
    const widthNorm = penSize / rect.width
    strokesRef.current.push({
      color,
      width: widthNorm,
      erase: tool === 'eraser',
      points: [norm(e)],
    })
    renderStrokes()
    drawRef.current.setPointerCapture?.(e.pointerId)
  }

  const moveDraw = (e) => {
    if (!drawingRef.current) return
    const s = strokesRef.current[strokesRef.current.length - 1]
    s.points.push(norm(e))
    // incremental draw of just the last segment
    const c = drawRef.current
    const ctx = c.getContext('2d')
    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over'
    ctx.strokeStyle = s.color
    ctx.lineWidth = Math.max(1, s.width * c.width)
    const a = s.points[s.points.length - 2]
    const b = s.points[s.points.length - 1]
    ctx.beginPath()
    ctx.moveTo(a.x * c.width, a.y * c.height)
    ctx.lineTo(b.x * c.width, b.y * c.height)
    ctx.stroke()
    ctx.globalCompositeOperation = 'source-over'
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const undo = () => {
    strokesRef.current.pop()
    setStrokeTick((t) => t + 1)
  }

  const clearAll = () => {
    strokesRef.current = []
    setStrokeTick((t) => t + 1)
    setStickers([])
    setTexts([])
    setSelected(null)
  }

  // ---- stickers ----
  const addSticker = (glyph) => {
    const id = uid()
    setStickers((s) => [...s, { id, glyph, x: 0.5, y: 0.4 + Math.random() * 0.2, size: 0.13, rot: 0 }])
    setSelected(id)
  }

  // ---- text ----
  const addText = () => {
    const t = textInput.trim()
    if (!t) return
    const id = uid()
    setTexts((arr) => [...arr, { id, text: t, x: 0.5, y: 0.5, color, size: 0.07, rot: 0 }])
    setTextInput('')
    setSelected(id)
  }

  // ---- shared drag for stickers + texts ----
  const onItemPointerDown = (e, id) => {
    e.stopPropagation()
    setSelected(id)
    dragRef.current = id
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  // ---- resize from a corner handle ----
  const onResizePointerDown = (e, id, item) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = boxRef.current.getBoundingClientRect()
    const cx = rect.left + item.x * rect.width
    const cy = rect.top + item.y * rect.height
    const startDist = Math.hypot(e.clientX - cx, e.clientY - cy) || 1
    resizeRef.current = { id, cx, cy, startDist, startSize: item.size }
    setSelected(id)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  // ---- rotate from a handle (drag left/right) ----
  const onRotatePointerDown = (e, id, item) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = boxRef.current.getBoundingClientRect()
    rotateRef.current = {
      id,
      cx: rect.left + item.x * rect.width,
      cy: rect.top + item.y * rect.height,
    }
    setSelected(id)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const onItemPointerMove = (e) => {
    if (rotateRef.current) {
      const r = rotateRef.current
      const deg = (Math.atan2(e.clientY - r.cy, e.clientX - r.cx) * 180) / Math.PI + 90
      setStickers((s) => s.map((st) => (st.id === r.id ? { ...st, rot: deg } : st)))
      setTexts((s) => s.map((t) => (t.id === r.id ? { ...t, rot: deg } : t)))
      return
    }
    if (resizeRef.current) {
      const r = resizeRef.current
      const dist = Math.hypot(e.clientX - r.cx, e.clientY - r.cy)
      const next = Math.min(0.6, Math.max(0.025, r.startSize * (dist / r.startDist)))
      setStickers((s) => s.map((st) => (st.id === r.id ? { ...st, size: next } : st)))
      setTexts((s) => s.map((t) => (t.id === r.id ? { ...t, size: next } : t)))
      return
    }
    if (!dragRef.current) return
    const rect = boxRef.current.getBoundingClientRect()
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height))
    const id = dragRef.current
    setStickers((s) => s.map((st) => (st.id === id ? { ...st, x, y } : st)))
    setTexts((s) => s.map((t) => (t.id === id ? { ...t, x, y } : t)))
  }
  const onItemPointerUp = () => {
    dragRef.current = null
    resizeRef.current = null
    rotateRef.current = null
  }
  const removeSticker = (id) => setStickers((s) => s.filter((st) => st.id !== id))
  const removeText = (id) => setTexts((s) => s.filter((t) => t.id !== id))

  // ---- export ----
  const download = async () => {
    await document.fonts?.ready?.catch(() => {})
    const out = document.createElement('canvas')
    out.width = baseCanvas.width
    out.height = baseCanvas.height
    const ctx = out.getContext('2d')
    ctx.drawImage(baseCanvas, 0, 0)
    ctx.drawImage(drawRef.current, 0, 0)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    texts.forEach((t) => {
      const fs = t.size * out.width
      ctx.save()
      ctx.translate(t.x * out.width, t.y * out.height)
      ctx.rotate(((t.rot || 0) * Math.PI) / 180)
      ctx.font = `700 ${fs}px Fredoka, system-ui, sans-serif`
      ctx.fillStyle = t.color
      ctx.fillText(t.text, 0, 0)
      ctx.restore()
    })
    stickers.forEach((st) => {
      const fs = st.size * out.width
      ctx.save()
      ctx.translate(st.x * out.width, st.y * out.height)
      ctx.rotate(((st.rot || 0) * Math.PI) / 180)
      ctx.font = `${fs}px serif`
      ctx.fillText(st.glyph, 0, 0)
      ctx.restore()
    })
    downloadCanvas(out, filename)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* canvas stage */}
      <div className="flex justify-center">
        <div
          ref={boxRef}
          className="relative max-h-[84vh] touch-none select-none"
          onPointerMove={onItemPointerMove}
          onPointerUp={onItemPointerUp}
        >
          <CanvasImage
            canvas={baseCanvas}
            className="max-h-[84vh] w-auto rounded-2xl border-2 border-ink shadow-soft"
          />
          <canvas
            ref={drawRef}
            onPointerDown={startDraw}
            onPointerMove={moveDraw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            className="absolute inset-0 z-10 h-full w-full rounded-2xl no-cursor"
            style={{ cursor: 'crosshair' }}
          />

          {/* text items */}
          {texts.map((t) => (
            <div
              key={t.id}
              onPointerDown={(e) => onItemPointerDown(e, t.id)}
              className="absolute z-20 cursor-grab whitespace-nowrap font-display font-700 leading-none active:cursor-grabbing"
              style={{
                left: `${t.x * 100}%`,
                top: `${t.y * 100}%`,
                transform: `translate(-50%,-50%) rotate(${t.rot || 0}deg)`,
                color: t.color,
                fontSize: `${Math.max(10, t.size * boxW)}px`,
                touchAction: 'none',
              }}
            >
              <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">{t.text}</span>
              {selected === t.id && (
                <>
                  <button
                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); removeText(t.id) }}
                    className="absolute -right-3 -top-3 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm"
                  >
                    ✕
                  </button>
                  <button
                    onPointerDown={(e) => onResizePointerDown(e, t.id, t)}
                    className="absolute -bottom-3 -right-3 grid h-6 w-6 cursor-nwse-resize touch-none place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm"
                    aria-label="Resize"
                  >
                    ⤢
                  </button>
                  <button
                    onPointerDown={(e) => onRotatePointerDown(e, t.id, t)}
                    className="absolute -top-3 -left-3 grid h-6 w-6 cursor-grab touch-none place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm active:cursor-grabbing"
                    aria-label="Rotate"
                  >
                    ↻
                  </button>
                </>
              )}
            </div>
          ))}

          {/* stickers */}
          {stickers.map((st) => (
            <div
              key={st.id}
              onPointerDown={(e) => onItemPointerDown(e, st.id)}
              className="absolute z-20 cursor-grab leading-none active:cursor-grabbing"
              style={{
                left: `${st.x * 100}%`,
                top: `${st.y * 100}%`,
                transform: `translate(-50%,-50%) rotate(${st.rot || 0}deg)`,
                touchAction: 'none',
              }}
            >
              <span className="block" style={{ fontSize: `${Math.max(14, st.size * boxW)}px` }}>
                {st.glyph}
              </span>
              {selected === st.id && (
                <>
                  <button
                    onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); removeSticker(st.id) }}
                    className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm"
                  >
                    ✕
                  </button>
                  <button
                    onPointerDown={(e) => onResizePointerDown(e, st.id, st)}
                    className="absolute -bottom-2 -right-2 grid h-6 w-6 cursor-nwse-resize touch-none place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm"
                    aria-label="Resize"
                  >
                    ⤢
                  </button>
                  <button
                    onPointerDown={(e) => onRotatePointerDown(e, st.id, st)}
                    className="absolute -left-2 -top-2 grid h-6 w-6 cursor-grab touch-none place-items-center rounded-full border-2 border-ink bg-white text-[11px] shadow-pop-sm active:cursor-grabbing"
                    aria-label="Rotate"
                  >
                    ↻
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* toolbar */}
      <div className="space-y-4">
        {/* frame */}
        <div className="panel space-y-3 p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Frame</p>
          <FrameSelector value={frameId} onChange={setFrameId} />
        </div>

        {/* draw */}
        <div className="panel space-y-4 p-4">
          <div className="flex gap-2">
            {[{ id: 'pen', label: '✎ Pen' }, { id: 'eraser', label: '⌫ Eraser' }].map((t) => (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex-1 rounded-2xl border-2 border-ink px-3 py-2 font-display text-sm font-600 transition-all ${
                  tool === t.id ? 'bg-ink text-white' : 'bg-white hover:-translate-y-0.5'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* thickness */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Thickness</p>
              <span className="font-mono text-[11px] text-ink/50">{penSize}px</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="40"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink/15 accent-pink-bold"
              />
              <span
                className="shrink-0 rounded-full border-2 border-ink bg-white"
                style={{ width: Math.max(6, penSize), height: Math.max(6, penSize), background: color }}
              />
            </div>
          </div>

          {/* colours */}
          <div>
            <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-ink/60">Color</p>
            <div className="flex gap-2">
              {DOODLE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColor(c.value); setTool('pen') }}
                  aria-label={c.name}
                  className={`h-9 w-9 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === c.value ? 'border-ink ring-2 ring-ink ring-offset-2' : 'border-ink/40'
                  }`}
                  style={{ background: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={undo} className="btn-pop flex-1 bg-purple-soft px-3 py-2 text-sm">↶ Undo</button>
            <button onClick={clearAll} className="btn-pop flex-1 bg-pink-soft px-3 py-2 text-sm">Clear</button>
          </div>
        </div>

        {/* text */}
        <div className="panel space-y-2 p-4">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/60">Text</p>
          <div className="flex gap-2">
            <input
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addText() }}
              placeholder="type something…"
              maxLength={40}
              className="min-w-0 flex-1 rounded-2xl border-2 border-ink px-3 py-2 font-body text-sm outline-none focus:ring-2 focus:ring-ink"
            />
            <button onClick={addText} className="btn-pop bg-sky px-4 py-2 text-sm">Add</button>
          </div>
          <p className="font-mono text-[10px] text-ink/45">tap an item to select · drag to move · ⤢ resize · ↻ rotate · ✕ delete</p>
        </div>

        {/* stickers */}
        <div className="panel p-4">
          <StickerEditor onAdd={addSticker} />
        </div>

        <div className="space-y-2">
          <motion.button
            onClick={download}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="btn-pop w-full bg-pink-bold text-white"
          >
            ↓ Save Picture
          </motion.button>
          <button
            onClick={onRetake}
            className="w-full rounded-full px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink/60 hover:text-ink"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  )
}
