import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Storefront, { type CommerceMode } from './Storefront'

gsap.registerPlugin(ScrollTrigger)

const assetBase = `${import.meta.env.BASE_URL}assets/`
const looks = Array.from({ length: 10 }, (_, i) => `${assetBase}look-${String(i + 1).padStart(2, '0')}.webp`)
const glyphs = ['8', '$', '^^', '%', '/']

function Logo() {
  return <svg className="wordmark" viewBox="0 0 355 110" aria-label="prmpt"><text x="0" y="86" fontFamily="Inter Tight, sans-serif" fontSize="104" fontWeight="600" letterSpacing="-10">prmpt</text><text x="319" y="28" fontFamily="Arial" fontSize="17" fontWeight="500">®</text></svg>
}

function App() {
  const reduceMotion = useReducedMotion()
  const [cols, setCols] = useState(() => window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4)
  const panelRef = useRef<HTMLDivElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoLeft = useRef<HTMLVideoElement>(null)
  const videoRight = useRef<HTMLVideoElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const activeSide = useRef<'left' | 'right'>('right')
  const pointerX = useRef(typeof window === 'undefined' ? 0 : window.innerWidth / 2)
  const [loaded, setLoaded] = useState(false)
  const [commerceView, setCommerceView] = useState<CommerceMode>(null)
  const [bagCount, setBagCount] = useState(() => { try { return (JSON.parse(localStorage.getItem('prmpt-bag') || '[]') as { quantity: number }[]).reduce((total, item) => total + item.quantity, 0) } catch { return 0 } })
  const updateBagCount = useCallback((count: number) => setBagCount(count), [])

  useEffect(() => {
    const resize = () => setCols(window.innerWidth < 640 ? 2 : window.innerWidth < 1024 ? 3 : 4)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const cells = useMemo(() => {
    const rows: number[][] = []
    let image = 0
    for (let r = 0; image < looks.length; r++) {
      const row = Array(cols).fill(-1) as number[]
      const a = (r * 2 + (r % 2)) % cols
      row[a] = image++
      if (r % 3 === 0 && image < looks.length) {
        const b = (a + 2) % cols === a ? (a + 1) % cols : (a + 2) % cols
        row[b] = image++
      }
      rows.push(row)
    }
    return { cols, rows }
  }, [cols])

  useEffect(() => {
    const root = document.documentElement
    const spacer = document.getElementById('scroll-spacer')!
    const panel = panelRef.current!
    const wrap = wrapRef.current!
    const cardEls = Array.from(document.querySelectorAll<HTMLElement>('.bp-card'))
    let raf = 0
    let lastGlyph = 0
    const setHeight = () => {
      root.style.setProperty('--vh', `${window.innerHeight}px`)
      const maxScroll = Math.max(0, wrap.scrollHeight - window.innerHeight)
      spacer.style.height = `${window.innerHeight + maxScroll + 2 * window.innerHeight}px`
      ScrollTrigger.refresh()
    }
    gsap.set(panel, { yPercent: 100 })
    const panelTween = gsap.to(panel, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: spacer, start: 'top top', end: () => `+=${window.innerHeight}`, scrub: true, invalidateOnRefresh: true } })
    const tick = () => {
      raf = 0
      const vh = window.innerHeight
      const scroll = window.scrollY
      const maxScroll = Math.max(0, wrap.scrollHeight - vh)
      const galleryProgress = Math.max(0, scroll - vh)
      gsap.set(wrap, { y: -Math.min(galleryProgress, maxScroll) })
      cardEls.forEach((card) => {
        const top = card.offsetTop + vh - scroll
        const bottom = top + card.offsetHeight
        const enter = Math.min(1, (vh - top) / (vh * 0.6))
        const exit = Math.min(1, bottom / (vh * 0.4))
        const scale = bottom <= 0 || top >= vh ? 0 : Math.max(0, Math.min(enter, exit))
        card.style.transform = `scale(${scale})`
      })
      const outroStart = vh + maxScroll
      const progress = Math.max(0, Math.min(1, (scroll - outroStart) / (vh - 100)))
      document.getElementById('outro-overlay')!.style.opacity = `${progress}`
      const info = document.getElementById('outro-info')!
      info.style.transform = `translateY(${-Number(info.dataset.outroOffset) * progress}px)`
      document.getElementById('outro-buy')!.style.transform = `scale(${progress})`
      document.getElementById('outro-footer')!.style.opacity = `${progress}`
      if (Date.now() - lastGlyph > 80 && scroll > 0) {
        lastGlyph = Date.now()
        const symbol = document.getElementById('circle-symbol')
        const current = symbol?.textContent || '8'
        let next = glyphs[Math.floor(Math.random() * glyphs.length)]
        if (next === current) next = glyphs[(glyphs.indexOf(next) + 1) % glyphs.length]
        if (symbol) symbol.textContent = next
      }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick) }
    const resize = () => setHeight()
    setHeight()
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', resize); panelTween.scrollTrigger?.kill(); panelTween.kill() }
  }, [cols])

  useEffect(() => {
    let frame = 0
    const scrub = () => {
      frame = 0
      if (window.matchMedia('(pointer: fine)').matches && window.scrollY < window.innerHeight) {
        const width = window.innerWidth
        const dead = Math.max(30, width * 0.05)
        const dx = pointerX.current - width / 2
        if (dx < -dead) activeSide.current = 'right'
        else if (dx > dead) activeSide.current = 'left'
        const video = activeSide.current === 'left' ? videoLeft.current : videoRight.current
        const other = activeSide.current === 'left' ? videoRight.current : videoLeft.current
        if (video && other) {
          video.style.display = 'block'; other.style.display = 'none'
          const distance = Math.max(0, Math.abs(dx) - dead)
          const available = Math.max(1, width / 2 - dead)
          if (Math.abs(dx) <= dead) {
            if (!video.seeking && video.currentTime !== 0) video.currentTime = 0
            if (!other.seeking && other.currentTime !== 0) other.currentTime = 0
          } else {
            const desired = (distance / available) * (video.duration || 0)
            if (!video.seeking && Number.isFinite(desired)) video.currentTime = Math.min(desired, Math.max(0, (video.duration || 0) - 0.04))
          }
          if (video.seeking || other.seeking) frame = requestAnimationFrame(scrub)
        }
      }
    }
    const onMove = (event: MouseEvent) => {
      pointerX.current = event.clientX
      if (cursorRef.current) { cursorRef.current.style.left = `${event.clientX}px`; cursorRef.current.style.top = `${event.clientY}px` }
      if (!frame && !reduceMotion) frame = requestAnimationFrame(scrub)
    }
    window.addEventListener('mousemove', onMove)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(frame) }
  }, [reduceMotion])

  const loadedVideo = () => { if (videoLeft.current?.readyState && videoRight.current?.readyState) setLoaded(true) }
  const mobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  return <main id="scroll-spacer">
    <div id="main-canvas" className={loaded ? 'loaded' : ''}>
      <video ref={videoLeft} className="film" src={`${assetBase}film-left.mp4`} muted playsInline preload="auto" onLoadedData={loadedVideo} />
      <video ref={videoRight} className="film" src={`${assetBase}film-right.mp4`} muted playsInline preload="auto" onLoadedData={loadedVideo} />
      {mobile && !reduceMotion && <MobileFilms left={videoLeft} right={videoRight} />}
    </div>
    <motion.div ref={cursorRef} className="custom-cursor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5, duration: .5 }} aria-hidden="true"><svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22.75" fill="none" stroke="white" strokeWidth="2.5"/><path d="M24 10v28M16 17c2-4 14-4 16 0M16 31c2 4 14 4 16 0M19 21l10 6m0-6-10 6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg></motion.div>
    <motion.div className="fixed-logo blend" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, ease: [.25, .1, .25, 1] }}><Logo /></motion.div>
    <motion.p className="caption blend" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .3, ease: [.25, .1, .25, 1] }}>A living archive of form, feeling and future memory. Curated for the ones who see beyond the frame.</motion.p>
    <motion.nav className="nav blend" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .15, ease: [.25, .1, .25, 1] }} aria-label="Main navigation">
      <button className="about-link" onClick={() => setCommerceView('help')}>ABOUT</button><div className="nav-actions"><button className="find-trigger" onClick={() => setCommerceView('search')}>FIND</button><button className="menu-trigger" aria-label="Open menu" onClick={() => setCommerceView('menu')}><svg viewBox="0 0 40 40"><path d="M0 14H40M0 26H40" /></svg></button><button className="cart-trigger" onClick={() => setCommerceView('bag')}>[ BAG {bagCount > 0 ? bagCount : ''} ]</button></div>
    </motion.nav>
    <motion.section id="outro-info" data-outro-offset={mobile ? 132 : 166} className="product-info blend" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45, duration: .6 }}>
      <div className="product-top"><div className="seal"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18.75" /></svg><span id="circle-symbol">8</span></div><p>ARCHIVE COLLECTION<br />“PROMPT”</p></div><div className="price">£94.99</div>
    </motion.section>
    <button id="outro-buy" className="view-button blend" onClick={() => setCommerceView('shop')} aria-label="View archive collection"><span>view</span><span className="view-arrow">↗</span></button>
    <footer id="outro-footer" className="footer blend"><span>PRMPT ® 2026</span><button onClick={() => setCommerceView('help')}>CLIENT SERVICE</button></footer>
    <div ref={panelRef} className="black-panel"><div ref={wrapRef} className="gallery-wrap" style={{ gridTemplateColumns: `repeat(${cells.cols}, minmax(0, 1fr))` }}>
      {cells.rows.flatMap((row, r) => row.map((idx, c) => idx < 0 ? <div key={`empty-${r}-${c}`} className="grid-spacer" /> : <figure className={`bp-card ${c < cells.cols / 2 ? 'origin-right' : 'origin-left'}`} key={idx}><img src={looks[idx]} alt={`PRMPT archive look ${String(idx + 1).padStart(2, '0')}`} /><figcaption><span>PRMPT ARCHIVE</span><span>{String(idx + 1).padStart(2, '0')} / 10</span></figcaption></figure>))}
      <div className="gallery-end"><span>END OF FILE — 001</span><span>SCROLL TO CONTINUE</span></div>
    </div></div>
    <div id="outro-overlay" />
    {commerceView && <Storefront key={commerceView} mode={commerceView} onClose={() => setCommerceView(null)} onBagCount={updateBagCount} />}
  </main>
}

function MobileFilms({ left, right }: { left: React.RefObject<HTMLVideoElement | null>, right: React.RefObject<HTMLVideoElement | null> }) {
  useEffect(() => {
    let current: HTMLVideoElement | null = right.current
    const first = right.current, second = left.current
    if (!first || !second) return
    first.style.display = 'block'; second.style.display = 'none'
    const swap = () => { const next = current === first ? second : first; if (current) current.style.display = 'none'; next.style.display = 'block'; current = next; void next.play() }
    first.addEventListener('ended', swap); second.addEventListener('ended', swap); void first.play().catch(() => {})
    return () => { first.removeEventListener('ended', swap); second.removeEventListener('ended', swap); first.pause(); second.pause() }
  }, [left, right])
  return null
}

export default App
