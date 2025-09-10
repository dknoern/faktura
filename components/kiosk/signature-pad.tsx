"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface SignaturePadProps {
  onSignatureChange: (signature: string) => void
  value?: string
}

export function SignaturePad({ onSignatureChange, value }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const lastDprRef = useRef<number>(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  const lastRectRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 })

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Measure using content-box dimensions to avoid border effects
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight
    // Ensure CSS size is explicitly set so layout and buffer align
    canvas.style.width = `${cssW}px`
    canvas.style.height = `${cssH}px`

    // Handle device pixel ratio for crisp lines and accurate mapping
    const dpr = Math.max(window.devicePixelRatio || 1, 1)
    lastDprRef.current = dpr
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)

    // Reset transform then scale to map CSS pixels to device pixels
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)

    // Set drawing properties (CSS pixel units)
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    lastRectRef.current = { w: Math.round(cssW), h: Math.round(cssH) }

    if (process.env.NODE_ENV !== 'production') {
      // Minimal diagnostics to console (won't affect UI)
      // eslint-disable-next-line no-console
      console.debug('[SignaturePad] css:', cssW, cssH, 'canvas:', canvas.width, canvas.height, 'dpr:', dpr)
    }

    // Load existing signature if provided
    if (value && value !== '') {
      const img = new Image()
      img.onload = () => {
        // Draw using CSS pixel dimensions since context is scaled
        ctx.drawImage(img, 0, 0, cssW, cssH)
        setIsEmpty(false)
      }
      img.src = value
    }
  }, [value])

  useEffect(() => {
    setupCanvas()
    
    // Add resize observer to handle dynamic sizing
    const canvas = canvasRef.current
    if (!canvas) return
    
    const resizeObserver = new ResizeObserver(() => {
      setupCanvas()
    })
    
    resizeObserver.observe(canvas)
    
    // Also listen for DPR/viewport scale changes
    const onWindowResize = () => {
      // If DPR changed (zoom/orientation), recompute
      if ((window.devicePixelRatio || 1) !== lastDprRef.current) {
        setupCanvas()
      }
    }
    window.addEventListener('resize', onWindowResize)
    window.visualViewport?.addEventListener('resize', onWindowResize)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', onWindowResize)
      window.visualViewport?.removeEventListener('resize', onWindowResize)
    }
  }, [setupCanvas])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement> | React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    // Map via bounding rect in CSS pixels
    const anyEvt = e as any
    // Prefer offsetX/offsetY (relative to the canvas padding edge; our canvas has no border/padding)
    if (typeof anyEvt.nativeEvent?.offsetX === 'number' && typeof anyEvt.nativeEvent?.offsetY === 'number') {
      return {
        x: anyEvt.nativeEvent.offsetX,
        y: anyEvt.nativeEvent.offsetY,
      }
    }

    const rect = canvas.getBoundingClientRect()
    // Use pageX/pageY; subtract layout offset (rect.left + scrollX)
    const pageX = 'touches' in e ? e.touches[0].pageX : (e as any).pageX
    const pageY = 'touches' in e ? e.touches[0].pageY : (e as any).pageY
    const leftOnPage = rect.left + window.scrollX
    const topOnPage = rect.top + window.scrollY

    // Context is DPR-scaled, so draw in CSS pixel coords directly
    const x = Math.min(Math.max(0, pageX - leftOnPage), rect.width)
    const y = Math.min(Math.max(0, pageY - topOnPage), rect.height)
    return { x, y }
  }

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    // Refresh canvas if DPR changed since last setup
    if ((window.devicePixelRatio || 1) !== lastDprRef.current) {
      setupCanvas()
    }
    // Also refresh if displayed rect size changed since last setup
    const canvas = canvasRef.current
    if (canvas) {
      const rectNow = canvas.getBoundingClientRect()
      const w = Math.round(rectNow.width)
      const h = Math.round(rectNow.height)
      if (w !== lastRectRef.current.w || h !== lastRectRef.current.h) {
        setupCanvas()
      }
    }
    if (!canvas) return

    // Ensure we continue to receive move events even if pointer leaves the element
    canvas.setPointerCapture?.(e.pointerId)

    setIsDrawing(true)
    setIsEmpty(false)

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)
    if (process.env.NODE_ENV !== 'production') {
      const rect = canvas.getBoundingClientRect()
      // eslint-disable-next-line no-console
      console.debug('[SignaturePad] start at', x, y, 'rectW:', Math.round(rect.width))
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(e)

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    
    setIsDrawing(false)
    
    const canvas = canvasRef.current
    if (!canvas) return

    if (e) {
      canvas.releasePointerCapture?.(e.pointerId)
    }

    // Convert canvas to base64 and notify parent
    const signature = canvas.toDataURL('image/png')
    onSignatureChange(signature)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onSignatureChange('')
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair touch-none"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-sm">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          disabled={isEmpty}
          className="flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
