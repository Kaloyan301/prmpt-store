import { lazy, Suspense, useEffect, useMemo, useState } from 'react'

const ThreeViewer = lazy(() => import('./ThreeViewer'))

type Product = {
  id: string
  name: string
  category: 'Headwear' | 'Clothing'
  price: number
  compareAt?: number
  images: string[]
  description: string
  material: string
  sizes?: string[]
  label?: string
  model: string
}
type BagLine = { id: string; size: string; quantity: number }
export type CommerceMode = 'shop' | 'menu' | 'bag' | 'help' | 'account' | 'search' | null
type StoreView = Exclude<CommerceMode, null> | 'checkout'

const assetBase = `${import.meta.env.BASE_URL}assets/`
const looks = Array.from({ length: 10 }, (_, i) => `${assetBase}look-${String(i + 1).padStart(2, '0')}.webp`)
const products: Product[] = [
  { id:'hat-01', name:'Archive Rib Beanie', category:'Headwear', price:3499, images:[looks[0],looks[6]], description:'A dense rib-knit beanie with the first PRMPT woven mark. A close, sculptural fit from the original archive portrait.', material:'Heavy recycled cotton knit · one size · hand wash', label:'01 / KNIT STUDY', model:'look-01' },
  { id:'hat-02', name:'Washed Logo Cap', category:'Headwear', price:4299, images:[looks[1],looks[7],looks[9]], description:'A low-profile six-panel cap in lived-in washed cotton, finished with raised archive lettering.', material:'Washed cotton twill · adjustable strap · one size', label:'02 / WASHED TWILL', model:'look-02' },
  { id:'hat-03', name:'After Hours Trapper', category:'Headwear', price:6899, images:[looks[2],looks[4]], description:'The cold-weather silhouette that started the collection: shaped crown, extended ear flaps and quiet tonal stitchwork.', material:'Weathered cotton shell · brushed lining · adjustable ties', label:'03 / WINTER FORM', model:'look-03' },
  { id:'hat-04', name:'Archive Leather Beret', category:'Headwear', price:9499, images:[looks[3],looks[5]], description:'A softly structured beret with a polished, almost liquid shape and the collection mark across the band.', material:'Soft-touch coated cotton · smooth lining · one size', label:'04 / SOFT STRUCTURE', model:'look-04' },
  { id:'hat-05', name:'Expedition Trapper', category:'Headwear', price:7299, images:[looks[4],looks[2]], description:'A full-length study of the archive trapper: oversized in attitude, pared back in every detail.', material:'Brushed cotton shell · soft ear flaps · one size', label:'05 / FULL LOOK', model:'look-05' },
  { id:'hat-06', name:'No. 06 Sculpted Beret', category:'Headwear', price:7899, images:[looks[5],looks[3]], description:'A second angle on the collection beret reveals its sculpted crown and softly curved leather-like finish.', material:'Textured vegan leather · cotton lining · one size', label:'06 / FORM STUDY', model:'look-06' },
  { id:'hat-07', name:'Night Shift Beanie', category:'Headwear', price:3499, images:[looks[6],looks[0]], description:'A deep, easy rib beanie with a wide turn-up and discreet woven PRMPT lettering.', material:'Heavy recycled cotton knit · one size · hand wash', label:'07 / RIB KNIT', model:'look-07' },
  { id:'hat-08', name:'Signal 08 Ball Cap', category:'Headwear', price:3999, compareAt:4499, images:[looks[7],looks[1],looks[9]], description:'The precise everyday cap: soft crown, curved brim and distressed edge finishing.', material:'Garment-washed cotton · adjustable back · one size', label:'08 / ARCHIVE FAVOURITE', model:'look-08' },
  { id:'hat-09', name:'Wide Brim Bucket', category:'Headwear', price:5499, images:[looks[8]], description:'A wide-brim bucket silhouette with an easy crown and long tonal ties. Built to frame the face.', material:'Washed cotton canvas · cotton ties · one size', label:'09 / WIDE BRIM', model:'look-09' },
  { id:'hat-10', name:'Blue Hour Denim Cap', category:'Headwear', price:4999, images:[looks[9],looks[1],looks[7]], description:'A blue-black denim cap with a broken-in finish, embroidered wordmark and gently distressed visor.', material:'Recycled denim · adjustable metal clasp · one size', label:'10 / DENIM STUDY', model:'look-10' },
  { id:'studio-tee', name:'PRMPT Uniform Tee', category:'Clothing', price:4499, images:[looks[6],looks[4]], description:'The clean black uniform tee from the image archive, cut with an easy shoulder and heavyweight drape.', material:'240 gsm organic cotton · relaxed unisex fit · machine wash', sizes:['XS','S','M','L','XL'], label:'UNIFORM / 01', model:'studio-tee' },
  { id:'archive-hoodie', name:'Archive Form Hoodie', category:'Clothing', price:8499, images:[looks[4],looks[6]], description:'A deep black hooded layer shaped to sit quietly with the headwear collection. Raised mark, sculptural hood, no excess.', material:'Heavy brushed organic cotton · relaxed unisex fit · machine wash', sizes:['XS','S','M','L','XL'], label:'UNIFORM / 02', model:'archive-hoodie' },
]

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`
const loadBag = (): BagLine[] => { try { const lines = JSON.parse(localStorage.getItem('prmpt-bag') || '[]') as BagLine[]; const ids = new Set(products.map(product => product.id)); return lines.filter(line => ids.has(line.id) && Number.isFinite(line.quantity) && line.quantity > 0) } catch { return [] } }

export default function Storefront({ mode, onClose, onBagCount }: { mode: CommerceMode; onClose: () => void; onBagCount: (count: number) => void }) {
  const [view, setView] = useState<StoreView>(mode || 'shop')
  const [category, setCategory] = useState('New In')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('featured')
  const [selected, setSelected] = useState<Product | null>(null)
  const [sizeSelection, setSizeSelection] = useState('M')
  const [expressDelivery, setExpressDelivery] = useState(false)
  const [bag, setBag] = useState<BagLine[]>(loadBag)
  const [saved, setSaved] = useState<string[]>(() => { try { const ids = new Set(products.map(product => product.id)); return (JSON.parse(localStorage.getItem('prmpt-saved') || '[]') as string[]).filter(id => ids.has(id)) } catch { return [] } })
  const [show3d, setShow3d] = useState(false)
  const [motionMode, setMotionMode] = useState(false)
  const [query, setQuery] = useState('')
  const [submittedOrder, setSubmittedOrder] = useState(false)
  const [newsletter, setNewsletter] = useState(false)
  const [accountNote, setAccountNote] = useState('')

  useEffect(() => {
    localStorage.setItem('prmpt-bag', JSON.stringify(bag))
    onBagCount(bag.reduce((total, line) => total + line.quantity, 0))
  }, [bag, onBagCount])

  useEffect(() => { localStorage.setItem('prmpt-saved', JSON.stringify(saved)) }, [saved])

  useEffect(() => {
    document.body.classList.add('commerce-open')
    return () => document.body.classList.remove('commerce-open')
  }, [])

  const visibleProducts = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    let list = products.filter(item => {
      const matchesCategory = category === 'New In' || category === 'Shop All' || category === 'Sale' || (category === 'Saved Pieces' ? saved.includes(item.id) : item.category === category)
      const matchesSearch = !normalized || `${item.name} ${item.category} ${item.description}`.toLowerCase().includes(normalized)
      return matchesCategory && matchesSearch
    })
    if (category === 'Sale') list = list.filter(item => item.compareAt)
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [category, search, sort, saved])

  const subtotal = bag.reduce((total, line) => total + (products.find(item => item.id === line.id)?.price || 0) * line.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= 12000 ? 0 : 495
  const deliveryFee = expressDelivery ? 895 : shipping
  const totalCount = bag.reduce((total, line) => total + line.quantity, 0)
  const changeBag = (next: BagLine[]) => setBag(next)
  const addToBag = (product: Product, size: string) => {
    changeBag(bag.some(line => line.id === product.id && line.size === size)
      ? bag.map(line => line.id === product.id && line.size === size ? { ...line, quantity: line.quantity + 1 } : line)
      : [...bag, { id: product.id, size, quantity: 1 }])
    setSelected(null); setShow3d(false); setView('bag')
  }
  const changeQuantity = (line: BagLine, delta: number) => changeBag(bag.map(row => row.id === line.id && row.size === line.size ? { ...row, quantity: row.quantity + delta } : row).filter(row => row.quantity > 0))
  const toggleSaved = (id: string) => setSaved(current => current.includes(id) ? current.filter(savedId => savedId !== id) : [...current, id])
  const openCategory = (next: string) => { setCategory(next); setSearch(''); setView('shop'); setSelected(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return <div className="shop-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="shop-topline"><button className="shop-wordmark" onClick={() => openCategory('New In')} aria-label="PRMPT home">prmpt<sup>®</sup></button><div className="shop-toplinks"><button onClick={() => setView('shop')}>SHOP</button><button onClick={() => setView('search')}>SEARCH</button><button onClick={() => setView('account')}>ACCOUNT</button><button onClick={() => { setCategory('Saved Pieces'); setView('shop') }}>SAVED ({saved.length})</button><button onClick={() => setView('bag')}>BAG ({totalCount})</button></div><button className="shop-close" onClick={onClose} aria-label="Close shop">CLOSE <b>×</b></button></div>
    <div className="shop-utility"><span>UK / GBP £</span><span>COMPLIMENTARY UK DELIVERY OVER £120</span><span>COLLECTION 001 — ONLINE EXCLUSIVE</span></div>
    <div className="shop-content">
      {view === 'shop' && <>
        <div className="catalog-header"><div><p className="eyebrow">PRMPT® / COLLECTION 001</p><h1>{category === 'New In' ? 'The Archive' : category}</h1><p className="catalog-intro">Pieces for looking closer. Made to be worn, kept and found again.</p></div><div className="catalog-tools"><label className="search-field"><span>⌕</span><input aria-label="Search the archive" placeholder="Search the archive" value={search} onChange={e => setSearch(e.target.value)} /></label><select aria-label="Sort products" value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Sort: Featured</option><option value="price-asc">Price: Low to high</option><option value="price-desc">Price: High to low</option></select></div></div>
        <div className="category-bar">{['New In', 'Shop All', 'Headwear', 'Clothing', 'Sale', 'Saved Pieces'].map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => { setCategory(item); setSearch('') }}>{item}<span>{item === 'Shop All' || item === 'New In' ? '12' : item === 'Saved Pieces' ? String(saved.length).padStart(2, '0') : String(products.filter(product => item === 'Sale' ? product.compareAt : product.category === item).length).padStart(2, '0')}</span></button>)}</div>
        {search && <p className="search-count">{visibleProducts.length} {visibleProducts.length === 1 ? 'RESULT' : 'RESULTS'} FOR “{search.toUpperCase()}”</p>}
        {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product, index) => <article className={`shop-card shop-card-${index % 3}`} key={product.id}>
          <button className="card-image-button" onClick={() => { setSelected(product); setSizeSelection(product.sizes?.[2] || 'ONE SIZE'); setShow3d(true); setMotionMode(false) }} aria-label={`View ${product.name}`}><img src={product.images[0]} alt={product.name} loading={index > 3 ? 'lazy' : 'eager'} /><span className="card-3d">3D + 4D VIEW ↗</span>{product.label && <span className="card-label">{product.label}</span>}</button>
          <div className="card-meta"><div><p className="card-category">{product.category.toUpperCase()}</p><button className="card-title" onClick={() => { setSelected(product); setSizeSelection(product.sizes?.[2] || 'ONE SIZE'); setShow3d(true); setMotionMode(false) }}>{product.name}</button></div><span>{money(product.price)}</span></div>
          <button className={`save-product ${saved.includes(product.id) ? 'is-saved' : ''}`} onClick={() => toggleSaved(product.id)} aria-label={saved.includes(product.id) ? `Remove ${product.name} from saved pieces` : `Save ${product.name}`}>{saved.includes(product.id) ? '♥ SAVED' : '♡ SAVE PIECE'}</button>
          <button className="quick-view" onClick={() => { setSelected(product); setSizeSelection(product.sizes?.[2] || 'ONE SIZE'); setShow3d(true); setMotionMode(false) }}>QUICK VIEW · 3D <span>↗</span></button>
        </article>)}</div> : <div className="empty-search"><span>NO MATCHES IN THIS ARCHIVE</span><button onClick={() => { setSearch(''); setCategory('Shop All') }}>CLEAR SEARCH ↗</button></div>}
        <section className="shop-story"><div><p className="eyebrow">FORM STUDY / 001</p><h2>Turn the<br />archive over.</h2><p>See every silhouette from every side, then switch on motion for an animated 360° object study.</p><button className="text-link" onClick={() => { setSelected(products[2]); setSizeSelection('ONE SIZE'); setShow3d(true); setMotionMode(false) }}>EXPLORE THE TRAPPER <span>↗</span></button></div><div className="story-image"><img src={looks[2]} alt="PRMPT archive trapper hat" /><span>FORM STUDY 03 — 2026</span></div></section>
        <div className="newsletter-block"><div><p className="eyebrow">THE PRMPT LETTER</p><h2>Notes from<br />the archive.</h2></div><form onSubmit={e => { e.preventDefault(); setNewsletter(true) }}><label htmlFor="newsletter-email">Occasional dispatches. No noise.</label><div><input id="newsletter-email" type="email" required placeholder="Your email address" /><button type="submit">{newsletter ? 'YOU’RE ON THE LIST ✓' : 'SIGN ME UP ↗'}</button></div><small>Preview only — this prototype does not send or store email addresses.</small></form></div>
        <footer className="shop-footer"><div className="footer-brand"><span>prmpt<sup>®</sup></span><p>A living archive of form, feeling and future memory.</p><small>© PRMPT 2026</small></div><div><b>SHOP</b>{['New In', 'Headwear', 'Clothing', 'Sale'].map(item => <button key={item} onClick={() => openCategory(item)}>{item}</button>)}</div><div><b>CLIENT SERVICE</b>{['Delivery & Returns', 'Size Guide', 'Track an Order', 'Contact', 'FAQs'].map(item => <button key={item} onClick={() => setView('help')}>{item}</button>)}</div><div><b>THE HOUSE</b>{['About PRMPT', 'Journal', 'Privacy & Cookies', 'Terms'].map(item => <button key={item} onClick={() => setView('help')}>{item}</button>)}</div></footer>
      </>}

      {view === 'menu' && <section className="menu-page"><p className="eyebrow">PRMPT® / INDEX</p><h1>What are you<br />looking for?</h1><div className="menu-columns"><div>{['New In', 'Shop All', 'Headwear', 'Clothing', 'Sale'].map((item, i) => <button key={item} onClick={() => openCategory(item)}><span>0{i + 1}</span>{item}<b>↗</b></button>)}</div><aside><p>CLIENT SERVICE</p>{['Delivery & Returns', 'Size Guide', 'Track an Order', 'Contact', 'FAQs'].map(item => <button key={item} onClick={() => setView('help')}>{item} ↗</button>)}<p className="menu-lower">THE HOUSE</p>{['About PRMPT', 'Journal', 'Privacy & Cookies'].map(item => <button key={item} onClick={() => setView('help')}>{item} ↗</button>)}</aside></div><div className="menu-note">COLLECTION 001 / LONDON · EVERYWHERE</div></section>}

      {view === 'bag' && <section className="bag-page"><div className="subpage-heading"><div><p className="eyebrow">PRMPT® / YOUR SELECTION</p><h1>Your bag <small>({totalCount})</small></h1></div><button className="back-link" onClick={() => setView('shop')}>← KEEP EXPLORING</button></div>{bag.length === 0 ? <div className="empty-bag"><p>Your bag is waiting for its first find.</p><button className="primary-button" onClick={() => setView('shop')}>EXPLORE THE ARCHIVE ↗</button><div className="empty-bag-image"><img src={looks[0]} alt="PRMPT archive look" /></div></div> : <div className="bag-layout"><div className="bag-lines">{bag.map(line => { const product = products.find(item => item.id === line.id)!; return <article className="bag-line" key={`${line.id}-${line.size}`}><img src={product.images[0]} alt={product.name} /><div className="bag-line-info"><p className="card-category">{product.category.toUpperCase()}</p><h2>{product.name}</h2><p>{line.size === 'ONE SIZE' ? 'One size' : `Size ${line.size}`}</p><div className="quantity-control"><button onClick={() => changeQuantity(line, -1)} aria-label={`Reduce ${product.name} quantity`}>−</button><span>{line.quantity}</span><button onClick={() => changeQuantity(line, 1)} aria-label={`Add ${product.name} quantity`}>+</button></div></div><strong>{money(product.price * line.quantity)}</strong><button className="remove-line" onClick={() => changeBag(bag.filter(row => row.id !== line.id || row.size !== line.size))}>REMOVE</button></article> })}<button className="text-link" onClick={() => setView('shop')}>← CONTINUE SHOPPING</button></div><aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><div className="shipping-progress"><span>{subtotal >= 12000 ? 'YOU HAVE UNLOCKED COMPLIMENTARY SHIPPING' : `ADD ${money(12000 - subtotal)} FOR COMPLIMENTARY SHIPPING`}</span><div><i style={{ width: `${Math.min(100, subtotal / 12000 * 100)}%` }} /></div></div><div><span>Subtotal</span><span>{money(subtotal)}</span></div><div><span>UK delivery</span><span>{shipping === 0 ? 'Complimentary' : money(shipping)}</span></div><p className="summary-note">Taxes included. Delivery is calculated before payment.</p><div className="summary-total"><span>Total</span><strong>{money(subtotal + deliveryFee)}</strong></div><button className="primary-button full" onClick={() => { setSubmittedOrder(false); setView('checkout') }}>CONTINUE TO CHECKOUT <span>↗</span></button><p className="secure-note">GUEST CHECKOUT · SECURE PAYMENT PREVIEW</p><div className="pay-marks">VISA　·　MASTERCARD　·　PAYPAL　·　KLARNA</div></aside></div>}</section>}

      {view === 'checkout' && <section className="checkout-page"><div className="subpage-heading"><div><p className="eyebrow">PRMPT® / CHECKOUT</p><h1>{submittedOrder ? 'Order received.' : 'Almost yours.'}</h1></div><button className="back-link" onClick={() => setView('bag')}>← BACK TO BAG</button></div>{submittedOrder ? <div className="order-success"><span>✓</span><h2>Thank you for finding us.</h2><p>This was a checkout preview. No payment was taken and no order was sent.</p><button className="primary-button" onClick={() => { changeBag([]); setView('shop') }}>RETURN TO THE ARCHIVE ↗</button></div> : <form className="checkout-grid" onSubmit={e => { e.preventDefault(); setSubmittedOrder(true) }}><div className="checkout-form"><p className="eyebrow">01 / CONTACT</p><label>Email address<input type="email" required autoComplete="email" placeholder="name@example.com" /></label><label className="checkline"><input type="checkbox" /> Email me the occasional PRMPT dispatch</label><p className="eyebrow section-space">02 / DELIVERY</p><div className="two-fields"><label>First name<input required autoComplete="given-name" /></label><label>Last name<input required autoComplete="family-name" /></label></div><label>Address<input required autoComplete="street-address" placeholder="House number and street" /></label><div className="two-fields"><label>Town / city<input required autoComplete="address-level2" /></label><label>Postcode<input required autoComplete="postal-code" /></label></div><label>Country / region<select defaultValue="United Kingdom"><option>United Kingdom</option><option>Ireland</option><option>France</option><option>Germany</option></select></label><div className="delivery-choice"><p>DELIVERY METHOD</p><label><input type="radio" name="delivery" value="standard" checked={!expressDelivery} onChange={() => setExpressDelivery(false)} /> Standard · 3–5 working days <span>{shipping ? money(shipping) : 'FREE'}</span></label><label><input type="radio" name="delivery" value="express" checked={expressDelivery} onChange={() => setExpressDelivery(true)} /> Express · 1–2 working days <span>£8.95</span></label></div><p className="eyebrow section-space">03 / PAYMENT</p><div className="payment-preview"><b>DEMO CHECKOUT</b><p>Card, PayPal and Klarna options would be connected by the live payment provider. No payment details are collected in this preview.</p></div><button type="submit" className="primary-button full">PLACE DEMO ORDER · {money(subtotal + deliveryFee)} ↗</button><p className="demo-disclaimer">This storefront is a prototype. Submitting this form only shows a local confirmation; no order is placed and no payment is taken.</p></div><aside className="checkout-summary"><p className="eyebrow">IN YOUR BAG · {totalCount}</p>{bag.map(line => { const item = products.find(product => product.id === line.id)!; return <div key={line.id + line.size} className="checkout-item"><img src={item.images[0]} alt="" /><div>{item.name}<small>Size {line.size} · Qty {line.quantity}</small></div><b>{money(item.price * line.quantity)}</b></div> })}<div className="summary-total"><span>Subtotal</span><span>{money(subtotal)}</span></div><div className="summary-total"><span>Delivery</span><span>{deliveryFee ? money(deliveryFee) : 'FREE'}</span></div><div className="summary-total final-total"><strong>Total · GBP</strong><strong>{money(subtotal + deliveryFee)}</strong></div><p>Prices include UK VAT.</p></aside></form>}</section>}

      {view === 'help' && <section className="help-page"><p className="eyebrow">PRMPT® / CLIENT SERVICE</p><h1>Here when<br />you need us.</h1><div className="help-grid"><div><p className="eyebrow">DELIVERY</p><h2>UK delivery, made clear.</h2><p>Standard delivery is £4.95 and complimentary on orders over £120. A delivery estimate appears at checkout in this prototype.</p></div><div><p className="eyebrow">RETURNS</p><h2>A little more time.</h2><p>Return requests can be made within 14 days of delivery. Items should be unworn and in their original condition.</p></div><div><p className="eyebrow">SIZING</p><h2>Find your fit.</h2><p>Our apparel is designed with a relaxed shape. If you are between sizes, choose your usual size for an easy fit or size down for closer.</p></div><div><p className="eyebrow">CONTACT</p><h2>Speak to a human.</h2><p>For this prototype, use hello@prmpt.studio as the customer-service contact placeholder.</p></div></div><button className="text-link" onClick={() => setView('shop')}>← BACK TO THE ARCHIVE</button></section>}

      {view === 'account' && <section className="account-page"><p className="eyebrow">PRMPT® / YOUR ACCOUNT</p><h1>Welcome back.</h1><p>Track an order or return a find. No account is needed to shop.</p><form onSubmit={e => { e.preventDefault(); setAccountNote('Account services are a preview. Guest checkout is ready to use.') }}><label>Email address<input type="email" required placeholder="name@example.com" /></label><label>Order number<input required placeholder="PRMPT-0000" /></label><button className="primary-button">LOOK UP MY ORDER ↗</button></form>{accountNote && <p className="inline-note">{accountNote}</p>}</section>}

      {view === 'search' && <section className="search-page"><p className="eyebrow">PRMPT® / SEARCH</p><h1>Find a piece.</h1><label className="large-search"><span>⌕</span><input autoFocus placeholder="Try ‘beanie’, ‘trapper’ or ‘hoodie’" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { setSearch(query); setCategory('Shop All'); setView('shop') } }} /></label><div className="suggestions"><span>POPULAR</span>{['Trapper', 'Beanie', 'Cap', 'Hoodie'].map(term => <button key={term} onClick={() => { setSearch(term); setCategory('Shop All'); setView('shop') }}>{term} ↗</button>)}</div></section>}
    </div>

    {selected && (
      <div className="product-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) { setSelected(null); setShow3d(false); setMotionMode(false) } }}>
        <section className="product-modal-card" role="dialog" aria-modal="true" aria-label={selected.name}>
          <button className="product-close" onClick={() => { setSelected(null); setShow3d(false); setMotionMode(false) }} aria-label="Close product">×</button>
          <div className="product-modal-media">
            {show3d ? <Suspense fallback={<div className="viewer-status"><span className="loader-ring" />BUILDING THE FORM</div>}><ThreeViewer model={selected.model} motionMode={motionMode} onMotionMode={() => setMotionMode(value => !value)} /></Suspense> : <img src={selected.images[0]} alt={selected.name} />}
            <button className="show-3d" onClick={() => { setShow3d(value => !value); setMotionMode(false) }}>{show3d ? 'VIEW CAMPAIGN PHOTOS' : 'ENTER 3D OBJECT ↗'}</button>
            {!show3d && <div className="product-thumbs">{selected.images.map((img, index) => <button key={img} onClick={() => setSelected({ ...selected, images: [img, ...selected.images.filter((_, i) => i !== index)] })}><img src={img} alt={`${selected.name} angle ${index + 1}`} /></button>)}</div>}
          </div>
          <div className="product-modal-info">
            <p className="eyebrow">{selected.category.toUpperCase()} / COLLECTION 001 · 3D + 4D</p>
            <h2>{selected.name}</h2><div className="detail-price">{money(selected.price)} <span>GBP · TAX INCLUDED</span></div>
            <p className="detail-copy">{selected.description}</p><p className="detail-material">{selected.material}</p>
            {selected.sizes ? <><div className="size-head"><span>SELECT SIZE</span><button onClick={() => { setSelected(null); setView('help') }}>SIZE GUIDE ↗</button></div><div className="size-options">{selected.sizes.map(size => <button key={size} className={sizeSelection === size ? 'chosen' : ''} onClick={() => setSizeSelection(size)}>{size}</button>)}</div></> : <p className="one-size">ONE SIZE / READY TO SHIP</p>}
            <button className="primary-button full add-button" onClick={() => addToBag(selected, selected.sizes ? sizeSelection : 'ONE SIZE')}>ADD TO BAG <span>{money(selected.price)} ↗</span></button>
            <div className="delivery-promise"><span>↗</span><div><b>COMPLIMENTARY DELIVERY OVER £120</b><p>UK delivery from £4.95 · 14-day returns</p></div></div>
            <details><summary>DETAILS & CARE</summary><p>{selected.material}. Designed as part of PRMPT Collection 001.</p></details><details><summary>DELIVERY & RETURNS</summary><p>Standard UK delivery £4.95; complimentary on orders over £120. Return requests within 14 days of delivery.</p></details>
            <p className="stock-note">● AVAILABLE / COLLECTION 001</p>
          </div>
        </section>
      </div>
    )}
  </div>
}
