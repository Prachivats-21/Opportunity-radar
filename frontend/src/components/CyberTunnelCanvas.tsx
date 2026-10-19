import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

// 3D Simplex noise GLSL
const SNOISE = `
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + 1.0 * C.xxx; vec3 x2 = x0 - i2 + 2.0 * C.xxx; vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0; vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy; vec4 y = y_ *ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0; vec4 s1 = floor(b1)*2.0 + 1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0); m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`

const hexToVec3 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

const Lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export const CyberTunnelCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let animationFrameId: number
    const w = window.innerWidth
    const h = window.innerHeight

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0A0E17, 10, 45)

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 400)
    camera.position.set(0, 0, 20)
    scene.add(camera)

    // 2. WebGL Renderer
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      })
    } catch {
      return // Graceful fallback if WebGL disabled
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)

    // 3. Tunnel Uniforms
    const uniforms = {
      uTime: { value: 0 },
      uAppear: { value: 0 },
      uColLow: { value: hexToVec3('#061a14') },
      uColHigh: { value: hexToVec3('#10b981') },
      uOpacity: { value: 1.0 },
      uSize: { value: 4.2 },
      uBrightness: { value: 0.55 },
      uSwirl: { value: 0.39 },
      uScale: { value: 0.18 },
      uCursor: { value: new THREE.Vector3() },
      uRepelRadius: { value: 2.4 },
      uRepelStrength: { value: 0.8 },
      uActivity: { value: 0 },
    }

    // 4. Tunnel Points Geometry & Custom Shader
    const tunnelGroup = new THREE.Group()
    scene.add(tunnelGroup)

    const sphereGeo = new THREE.SphereGeometry(4.2, 140, 280)
    const tunnelMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms,
      vertexShader: `
        uniform float uTime; uniform float uSize; uniform float uSwirl; uniform float uScale;
        uniform vec3 uColLow; uniform vec3 uColHigh;
        uniform vec3 uCursor; uniform float uRepelRadius; uniform float uRepelStrength; uniform float uActivity;
        varying float vFade; varying vec3 vColor;
        ${SNOISE}
        void main() {
          vec3 wp = vec3(position.x * 7.0, 0.0, position.z * 25.0);
          wp.x += position.y * 6.0;
          float wn = snoise(vec3(wp.x * 0.08, wp.z * 0.08, uTime * 0.15)) * 2.0;
          wn += snoise(vec3(wp.x * 0.16, wp.z * 0.16, uTime * 0.3)) * 0.8;

          float tunnelR = 12.0;
          float currentSliceRadius = sqrt(max(0.0, 17.64 - position.z * position.z));
          float maxSliceWidth = 9.2195 * currentSliceRadius;
          float normalizedX = wp.x / (maxSliceWidth + 0.001);
          float tunnelAngle = normalizedX * 3.14159265;

          float jitterAngle = snoise(vec3(position.x * 15.0, position.y * 15.0, uTime * 0.1)) * 0.35;
          float jitterZ = snoise(vec3(position.y * 15.0, position.z * 15.0, uTime * 0.1)) * 4.0;
          float ambientSwirl = snoise(vec3(position.x * 5.0, position.y * 5.0, uTime * 0.2)) * 3.0;
          tunnelAngle += jitterAngle + ambientSwirl * uSwirl;

          float dynamicR = tunnelR - wn;
          vec3 tunnelPos = vec3(dynamicR * sin(tunnelAngle), -dynamicR * cos(tunnelAngle), wp.z + jitterZ);

          vec3 finalPos = tunnelPos * uScale;
          vec4 modelPosition = modelMatrix * vec4(finalPos, 1.0);
          vec3 toP = modelPosition.xyz - uCursor;
          float cd = length(toP);
          float fall = smoothstep(uRepelRadius, 0.0, cd);
          modelPosition.xyz += normalize(toP + vec3(0.0001)) * fall * uRepelStrength * uActivity;
          vec4 mvPosition = viewMatrix * modelPosition;

          float colMix = smoothstep(-3.0, 3.0, position.y + position.x * 0.5);
          vColor = mix(uColLow, uColHigh, clamp(colMix, 0.0, 1.0));
          vFade = 1.0;

          gl_PointSize = uSize * (10.0 / -mvPosition.z);
          gl_PointSize = max(gl_PointSize, 1.4);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float uOpacity; uniform float uBrightness; uniform float uAppear;
        varying float vFade; varying vec3 vColor;
        void main() {
          vec2 xy = gl_PointCoord - 0.5;
          float ll = length(xy);
          if (ll > 0.5) discard;
          float a = smoothstep(0.5, 0.1, ll);
          gl_FragColor = vec4(vColor * uBrightness, vFade * a * uOpacity * uAppear);
        }
      `,
    })

    const tunnelPoints = new THREE.Points(sphereGeo, tunnelMaterial)
    tunnelPoints.frustumCulled = false
    tunnelGroup.add(tunnelPoints)

    // 5. Atmosphere Motes
    const N = 260
    const positions = new Float32Array(N * 3)
    const sizes = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20
      sizes[i] = 18 * (0.4 + Math.random())
    }

    const motesGeo = new THREE.BufferGeometry()
    motesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    motesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const motesMaterial = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: hexToVec3('#34d399') },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vA;
        void main() {
          vec3 v = position;
          v.z += sin(uTime * 0.3 + position.x * 2.0) * 1.5;
          v.x += cos(uTime * 0.2 + position.y * 2.0) * 0.8;
          vec4 mv = modelViewMatrix * vec4(v, 1.0);
          float d = length(v);
          vA = smoothstep(12.0, 2.0, d);
          gl_PointSize = size * (6.0 / -mv.z);
          gl_PointSize = max(gl_PointSize, 1.0);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          vec2 p = gl_PointCoord - 0.5;
          float l = length(p);
          if (l > 0.5) discard;
          float tex = smoothstep(0.5, 0.0, l);
          gl_FragColor = vec4(uColor * tex, tex * vA * 0.6);
        }
      `,
    })

    const motesPoints = new THREE.Points(motesGeo, motesMaterial)
    motesPoints.frustumCulled = false
    scene.add(motesPoints)

    // 6. Interaction State (Scroll & Mouse Damping)
    let scrollTarget = 0
    let scrollSmooth = 0
    let scrollCurrent = 0

    const mouseTarget = { x: 0, y: 0 }
    const mouse = { x: 0, y: 0 }
    let pointerActive = false
    let lastMoveTime = performance.now()
    const pointerWorld = new THREE.Vector3()
    let pointerActivity = 0
    let rollPhase = 0
    let t0 = performance.now() / 1000
    const appearStart = performance.now()

    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      scrollTarget = clamp(window.scrollY / maxScroll, 0, 1)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1
      pointerActive = true
      lastMoveTime = performance.now()
    }

    const onMouseLeave = () => {
      pointerActive = false
    }

    const onResize = () => {
      const curW = window.innerWidth
      const curH = window.innerHeight
      camera.aspect = curW / curH
      camera.updateProjectionMatrix()
      renderer.setSize(curW, curH, false)
      onScroll()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('resize', onResize)

    // 7. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const t = performance.now() / 1000
      const dt = Math.min(0.05, t - t0)
      t0 = t

      // Smooth scroll & mouse lerp
      scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.08)
      scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.05)

      mouse.x = Lerp(mouse.x, mouseTarget.x, 0.05)
      mouse.y = Lerp(mouse.y, mouseTarget.y, 0.05)

      // Camera motion: banks flight toward cursor & warp-flies down the tube
      camera.position.set(mouse.x * 0.15, mouse.y * 0.15, 20 - scrollCurrent * 26)
      camera.lookAt(mouse.x * 0.45, mouse.y * 0.45, camera.position.z - 12)

      // Pointer to world space
      if (pointerActive) {
        const _ndc = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera)
        const _dir = _ndc.sub(camera.position).normalize()
        if (Math.abs(_dir.z) > 1e-4) {
          const tt = -camera.position.z / _dir.z
          if (tt > 0 && Number.isFinite(tt)) {
            const _tgt = camera.position.clone().addScaledVector(_dir, tt)
            pointerWorld.lerp(_tgt, 0.1)
          }
        }
      }

      const idle = (performance.now() - lastMoveTime) / 1000
      pointerActivity += ((pointerActive && idle < 3 ? 1 : 0) - pointerActivity) * 0.06

      // Update uniforms
      uniforms.uTime.value = t
      uniforms.uSwirl.value = 0.39 * (1 + scrollCurrent * 1.5)
      rollPhase += dt * (0.065 + scrollCurrent * 0.05)
      tunnelGroup.rotation.z = rollPhase

      uniforms.uCursor.value.copy(pointerWorld)
      uniforms.uActivity.value = pointerActivity

      const elapsed = (performance.now() - appearStart) / 1000
      uniforms.uAppear.value = clamp((elapsed - 0.2) / 1.4, 0, 1)

      motesMaterial.uniforms.uTime.value = t

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', onResize)

      sphereGeo.dispose()
      tunnelMaterial.dispose()
      motesGeo.dispose()
      motesMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="cyber-3d-background" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-tunnel-canvas" />
      {/* Corner flame ambient glows */}
      <div className="corner-flame top-left" />
      <div className="corner-flame top-right" />
      <div className="corner-flame bottom-left" />
      <div className="corner-flame bottom-right" />
    </div>
  )
}
