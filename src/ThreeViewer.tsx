import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

type Silhouette = 'beanie' | 'cap' | 'trapper' | 'beret' | 'bucket' | 'tee' | 'hoodie'
type Props = { model: string; motionMode: boolean; onMotionMode: () => void }

const variants: Record<string, { silhouette: Silhouette; color: string; accent: string }> = {
  'look-01': { silhouette: 'beanie', color: '#111216', accent: '#dad8d0' },
  'look-02': { silhouette: 'cap', color: '#57574f', accent: '#dedbd0' },
  'look-03': { silhouette: 'trapper', color: '#22242b', accent: '#77776e' },
  'look-04': { silhouette: 'beret', color: '#111217', accent: '#dad8d0' },
  'look-05': { silhouette: 'trapper', color: '#202127', accent: '#c9c5b9' },
  'look-06': { silhouette: 'beret', color: '#111217', accent: '#dad8d0' },
  'look-07': { silhouette: 'beanie', color: '#101115', accent: '#dddacf' },
  'look-08': { silhouette: 'cap', color: '#111319', accent: '#e6e2d8' },
  'look-09': { silhouette: 'bucket', color: '#464943', accent: '#dedacf' },
  'look-10': { silhouette: 'cap', color: '#586477', accent: '#e9e5da' },
  'studio-tee': { silhouette: 'tee', color: '#101115', accent: '#dcd8cd' },
  'archive-hoodie': { silhouette: 'hoodie', color: '#17181c', accent: '#dcd8cd' },
}

function material(color: string, roughness = 0.78) { return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 }) }

function buildMannequinHead(group: THREE.Group) {
  const face = new THREE.Group(); face.position.y = 0.04; group.add(face)
  const skin = material('#d4c9bb',0.72)
  const hair = material('#111216',0.34)
  const ink = material('#171719',0.4)
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x=0, y=0, z=0) => { const mesh=new THREE.Mesh(geo,mat); mesh.position.set(x,y,z); mesh.castShadow=true; face.add(mesh); return mesh }
  add(new THREE.LatheGeometry([[0,0],[0.17,0.015],[0.25,0.1],[0.32,0.23],[0.37,0.45],[0.35,0.68],[0.26,0.85],[0.12,0.96],[0,0.98]].map(([r,y])=>new THREE.Vector2(r,y)),48),skin)
  const crown=add(new THREE.SphereGeometry(1,28,20),hair,0,0.56,-0.075); crown.scale.set(0.385,0.48,0.37)
  for(const side of [-1,1]) {
    const lock=add(new THREE.SphereGeometry(1,20,16),hair,side*0.31,0.24,0.075); lock.scale.set(0.085,0.58,0.15)
    add(new THREE.SphereGeometry(0.075,16,12),skin,side*0.355,0.47,0.015)
    const white=material('#e6e1da',0.42)
    add(new THREE.SphereGeometry(0.047,14,12),white,side*0.135,0.55,0.338)
    add(new THREE.SphereGeometry(0.024,12,10),ink,side*0.135,0.55,0.377)
  }
  // A spare, sculptural face keeps attention on the headwear while clearly reading as a model.
  const nose=add(new THREE.SphereGeometry(0.055,14,10),skin,0,0.4,0.37); nose.scale.set(0.58,1.25,0.9)
  const mouth=add(new THREE.TorusGeometry(0.065,0.009,6,28,Math.PI),material('#866d68',0.8),0,0.275,0.346); mouth.rotation.z=Math.PI
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.145,0.18,0.34,32),skin); neck.position.set(0,-0.1,0); neck.castShadow=true; group.add(neck)
  const shoulders=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),material('#17181c',0.84)); shoulders.position.set(0,-0.38,0); shoulders.scale.set(0.66,0.28,0.32); shoulders.castShadow=true; group.add(shoulders)
}

function buildHat(group: THREE.Group, kind: Silhouette, color: string, accent: string) {
  const cloth = material(color, 0.86)
  const seam = material(color === '#111217' || color === '#101115' ? '#33343a' : '#787972', 0.92)
  const logoCanvas = document.createElement('canvas'); logoCanvas.width = 512; logoCanvas.height = 128
  const context = logoCanvas.getContext('2d')!
  context.clearRect(0,0,512,128); context.fillStyle = accent; context.font = '700 76px Arial'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText('PRMPT®',256,68)
  const logoTexture = new THREE.CanvasTexture(logoCanvas); logoTexture.colorSpace = THREE.SRGBColorSpace
  const logoMaterial = new THREE.MeshBasicMaterial({ map: logoTexture, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
    const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.rotation.set(rx, ry, rz); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh
  }
  const lathe = (points: [number, number][], mat = cloth, segs = 64) => add(new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segs), mat)
  const patch = () => { const mark = add(new THREE.PlaneGeometry(0.34,0.085),logoMaterial,0,0.58,0.39); mark.rotation.x=-0.12 }
  const torus = (major: number, tube: number, y: number, mat = seam, scaleX = 1, scaleZ = 1) => {
    const ring = add(new THREE.TorusGeometry(major, tube, 10, 72), mat, 0, y)
    ring.rotation.x = Math.PI / 2; ring.scale.set(scaleX, scaleZ, 1); return ring
  }

  if (kind === 'tee' || kind === 'hoodie') {
    const hoodie = kind === 'hoodie'
    const shape = new THREE.Shape()
    shape.moveTo(-0.38, 0.65); shape.quadraticCurveTo(-0.57, 0.56, -0.7, 0.48); shape.lineTo(-0.54, 0.08); shape.lineTo(-0.4, 0.16); shape.lineTo(-0.34, -0.72); shape.quadraticCurveTo(0, -0.82, 0.34, -0.72); shape.lineTo(0.4, 0.16); shape.lineTo(0.54, 0.08); shape.lineTo(0.7, 0.48); shape.quadraticCurveTo(0.57, 0.56, 0.38, 0.65); shape.quadraticCurveTo(0, 0.72, -0.38, 0.65)
    const body = add(new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.025, bevelThickness: 0.025, curveSegments: 12 }), cloth, 0, 0, -0.1)
    body.castShadow = true
    // Neck opening and tailored shoulder/sleeve seams give the silhouette depth.
    add(new THREE.TorusGeometry(0.13, 0.035, 10, 40), seam, 0, 0.63, 0.115).scale.set(1.12, 0.82, 1)
    if (hoodie) {
      const hood = add(new THREE.TorusGeometry(0.22, 0.12, 14, 56, Math.PI), cloth, 0, 0.71, -0.02, 0, 0, Math.PI)
      hood.scale.set(1.15, 1.1, 1)
      add(new THREE.BoxGeometry(0.035, 0.43, 0.018), seam, -0.09, 0.05, 0.115, 0.08)
      add(new THREE.BoxGeometry(0.035, 0.43, 0.018), seam, 0.09, 0.05, 0.115, -0.08)
      add(new THREE.BoxGeometry(0.48, 0.16, 0.026), seam, 0, -0.53, 0.12)
    }
    add(new THREE.PlaneGeometry(0.37,0.09), logoMaterial, 0, 0.2, 0.13)
    return
  }

  if (kind === 'beanie') {
    lathe([[0,0.06],[0.36,0.06],[0.43,0.09],[0.45,0.2],[0.45,0.48],[0.41,0.7],[0.32,0.86],[0.18,0.97],[0,1.01]])
    lathe([[0.43,0.12],[0.465,0.13],[0.47,0.34],[0.45,0.35]], seam)
    for (let i = 0; i < 16; i++) { const a = i * Math.PI * 2 / 16; const rib = add(new THREE.CylinderGeometry(0.009,0.009,0.48,6), seam, Math.sin(a)*0.444,0.56,Math.cos(a)*0.444); rib.rotation.z = Math.sin(a)*0.08; rib.rotation.x = Math.cos(a)*0.08 }
    patch()
  } else if (kind === 'beret') {
    lathe([[0,0.1],[0.4,0.1],[0.47,0.13],[0.45,0.22],[0.55,0.32],[0.61,0.42],[0.58,0.52],[0.42,0.62],[0.2,0.68],[0,0.7]])
    torus(0.43,0.045,0.16,seam,1,1)
    add(new THREE.CylinderGeometry(0.025,0.035,0.08,12), seam, 0,0.73,0)
    patch()
  } else if (kind === 'bucket') {
    lathe([[0,0.15],[0.35,0.15],[0.4,0.2],[0.38,0.57],[0.32,0.68],[0.33,0.72],[0.48,0.73],[0.67,0.78],[0.74,0.86],[0.73,0.9],[0.65,0.89],[0.43,0.82],[0.32,0.8],[0,0.8]])
    torus(0.46,0.012,0.79,seam,1.35,1.35)
    patch()
  } else {
    // Cap/trapper crown, lower band and a sculpted forward visor.
    lathe([[0,0.12],[0.39,0.12],[0.45,0.18],[0.46,0.4],[0.4,0.57],[0.3,0.68],[0.14,0.73],[0,0.74]])
    torus(0.42,0.025,0.17,seam,1,1)
    const visorShape = new THREE.Shape(); visorShape.moveTo(-0.43,0.17); visorShape.quadraticCurveTo(-0.54,0.04,-0.58,-0.22); visorShape.quadraticCurveTo(0,-0.3,0.58,-0.22); visorShape.quadraticCurveTo(0.54,0.04,0.43,0.17); visorShape.quadraticCurveTo(0,0.23,-0.43,0.17)
    add(new THREE.ExtrudeGeometry(visorShape,{depth:0.07,bevelEnabled:true,bevelSegments:3,bevelSize:0.035,bevelThickness:0.025}),cloth,0,0.1,0.25,Math.PI/2)
    if (kind === 'trapper') {
      for (const side of [-1,1]) {
        const flap = add(new THREE.SphereGeometry(1,24,16), cloth, side*0.43,-0.13,0.03)
        flap.scale.set(0.16,0.38,0.25)
        add(new THREE.BoxGeometry(0.075,0.4,0.03), seam, side*0.44,-0.52,0.09,side*0.1)
      }
    }
    patch()
  }
}

export default function ThreeViewer({ model: modelId, motionMode, onMotionMode }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let frame = 0
    let disposed = false
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#e6e3dc')
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    camera.position.set(2.75, 1.65, 4.45)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    host.appendChild(renderer.domElement)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x77736b, 2.2))
    const key = new THREE.DirectionalLight(0xffffff, 3); key.position.set(4,6,5); scene.add(key)
    const rim = new THREE.DirectionalLight(0xbfc9dc, 2.1); rim.position.set(-4,3,-4); scene.add(rim)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.3,64), material('#d7d3ca',0.82)); floor.rotation.x = -Math.PI/2; floor.position.y = -1.12; floor.receiveShadow = true; scene.add(floor)
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.86,0.09,64), material('#c5c1b8',0.65)); plinth.position.y = -1.05; plinth.castShadow = true; scene.add(plinth)
    const product = new THREE.Group()
    const variant = variants[modelId] || variants['look-01']
    if (variant.silhouette === 'tee' || variant.silhouette === 'hoodie') { buildHat(product, variant.silhouette, variant.color, variant.accent); product.scale.setScalar(1.18); product.position.y = -0.1 }
    else { buildMannequinHead(product); buildHat(product, variant.silhouette, variant.color, variant.accent); product.rotation.x = variant.silhouette === 'trapper' ? -0.08 : 0; product.position.y = -0.6 }
    scene.add(product)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false
    controls.minDistance = 2.5; controls.maxDistance = 7; controls.minPolarAngle = 0.42; controls.maxPolarAngle = Math.PI*0.78
    controls.target.set(0,0.1,0)
    const render = () => { frame = 0; controls.update(); renderer.render(scene,camera) }
    const requestRender = () => { if (!frame && !disposed) frame = requestAnimationFrame(render) }
    controls.addEventListener('change',requestRender)
    const resize = () => { const w=host.clientWidth||1,h=host.clientHeight||1; camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); requestRender() }
    const observer = new ResizeObserver(resize); observer.observe(host); resize()
    setStatus('ready')
    let anim = 0
    let previous = 0
    const animate = (time: number) => {
      if (disposed) return
      if (time-previous > 30) {
        const t=time*0.001
        product.rotation.y += motionMode ? 0.007 : 0.0008
        product.position.y = (variant.silhouette === 'tee' || variant.silhouette === 'hoodie' ? -0.1 : -0.6) + (motionMode ? Math.sin(t*1.8)*0.035 : 0)
        product.rotation.z = motionMode ? Math.sin(t*1.5)*0.018 : 0
        renderer.render(scene,camera); previous=time
      }
      anim=requestAnimationFrame(animate)
    }
    if (motionMode) anim=requestAnimationFrame(animate)
    else requestRender()
    return () => {
      disposed=true; cancelAnimationFrame(frame); cancelAnimationFrame(anim); observer.disconnect(); controls.removeEventListener('change',requestRender); controls.dispose()
      scene.traverse(o=>{ if(o instanceof THREE.Mesh){ o.geometry.dispose(); const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{Object.values(m).forEach(v=>{if(v instanceof THREE.Texture)v.dispose()});m.dispose()}) } })
      renderer.dispose(); renderer.domElement.remove()
    }
  }, [modelId,motionMode])

  return <div className="three-viewer" ref={hostRef} aria-label="Interactive 3D product viewer">
    {status==='loading' && <div className="viewer-status"><span className="loader-ring"/>BUILDING THE FORM</div>}
    {status==='error' && <div className="viewer-status viewer-error">This 3D view could not start. Try another WebGL-enabled browser.</div>}
    <div className="viewer-hint">DRAG TO ROTATE <span>·</span> SCROLL TO ZOOM</div>
    <div className="viewer-controls"><span>360° OBJECT VIEW</span><button className={motionMode?'active':''} onClick={onMotionMode}>{motionMode?'4D MOTION ON':'ENTER 4D MOTION ↗'}</button></div>
  </div>
}
