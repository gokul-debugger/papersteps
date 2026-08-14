import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

interface PdfPreviewProps {
  url: string
  title: string
}

export function PdfPreview({ url, title }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [zoom, setZoom] = useState(() =>
    window.matchMedia('(max-width: 600px)').matches ? 0.5 : 1,
  )
  const [isRendering, setIsRendering] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPageNumber(1)
  }, [url])

  useEffect(() => {
    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | null = null
    let loadingTask: { destroy: () => Promise<void> } | null = null

    const render = async () => {
      setIsRendering(true)
      setError(null)
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
        const task = pdfjs.getDocument({ url })
        loadingTask = task
        const pdf = await task.promise
        if (cancelled) return

        setPageCount(pdf.numPages)
        const safePage = Math.min(pageNumber, pdf.numPages)
        const page = await pdf.getPage(safePage)
        if (cancelled) return

        const canvas = canvasRef.current
        const context = canvas?.getContext('2d')
        if (!canvas || !context) throw new Error('Canvas rendering is unavailable in this browser.')

        const viewport = page.getViewport({ scale: 1.2 * zoom })
        const outputScale = Math.min(window.devicePixelRatio || 1, 2)
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        })
        await renderTask.promise
      } catch (renderError) {
        if (!cancelled && !(renderError instanceof Error && renderError.name === 'RenderingCancelledException')) {
          setError(renderError instanceof Error ? renderError.message : 'The page could not be rendered.')
        }
      } finally {
        if (!cancelled) setIsRendering(false)
      }
    }

    void render()
    return () => {
      cancelled = true
      renderTask?.cancel()
      void loadingTask?.destroy()
    }
  }, [pageNumber, url, zoom])

  return (
    <div className="pdf-viewer" aria-label={`Preview of ${title}`}>
      <div className="pdf-viewer__toolbar">
        <div>
          <button className="icon-button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))} disabled={pageNumber === 1} title="Previous page">
            <ChevronLeft size={17} />
          </button>
          <span>Page {pageNumber} of {pageCount}</span>
          <button className="icon-button" onClick={() => setPageNumber((page) => Math.min(pageCount, page + 1))} disabled={pageNumber === pageCount} title="Next page">
            <ChevronRight size={17} />
          </button>
        </div>
        <div>
          <button className="icon-button" onClick={() => setZoom((value) => Math.max(0.4, value - 0.1))} disabled={zoom <= 0.4} title="Zoom out"><ZoomOut size={17} /></button>
          <span>{Math.round(zoom * 100)}%</span>
          <button className="icon-button" onClick={() => setZoom((value) => Math.min(1.6, value + 0.1))} disabled={zoom >= 1.6} title="Zoom in"><ZoomIn size={17} /></button>
        </div>
      </div>
      <div className="pdf-viewer__viewport">
        {isRendering && <div className="pdf-render-status"><LoaderCircle className="spin" size={24} /> Rendering page</div>}
        {error ? <div className="pdf-render-error">{error}</div> : <canvas ref={canvasRef} />}
      </div>
    </div>
  )
}
