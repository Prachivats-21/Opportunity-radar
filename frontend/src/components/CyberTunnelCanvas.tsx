import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

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
    let isDisposed = false
    let curW = window.innerWidth
    let curH = window.innerHeight

    // 1. Try WebGL Renderer
    let renderer: THREE.WebGLRenderer | null = null
    let scene: THREE.Scene | null = null
    let camera: THREE.PerspectiveCamera | null = null
    let starGeo: THREE.BufferGeometry | null = null
    let starMaterial: THREE.ShaderMaterial | null = null

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'default',
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      renderer.setSize(curW, curH, false)
    } catch {
      renderer = null
    }

    // 2. Interaction state (shared by WebGL & 2D fallback)
    let scrollTarget = 0
    let scrollSmooth = 0
    let scrollCurrent = 0

    const mouseTarget = { x: 0, y: 0 }
    const mouse = { x: 0, y: 0 }

    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
      scrollTarget = clamp(window.scrollY / maxScroll, 0, 1)
    }

    const onMouseMove = (e: MouseEvent) => {
      mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1
    }

    const onResize = () => {
      curW = window.innerWidth
      curH = window.innerHeight
      if (renderer && camera) {
        camera.aspect = curW / curH
        camera.updateProjectionMatrix()
        renderer.setSize(curW, curH, false)
      } else {
        canvas.width = curW * Math.min(window.devicePixelRatio || 1, 2)
        canvas.height = curH * Math.min(window.devicePixelRatio || 1, 2)
      }
      onScroll()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', onResize)

    // A) WEBGL PATH
    if (renderer) {
      scene = new THREE.Scene()
      camera = new THREE.PerspectiveCamera(50, curW / curH, 0.1, 400)
      camera.position.set(0, 0, 18)
      scene.add(camera)

      const COUNT = 900
      const positions = new Float32Array(COUNT * 3)
      const colors = new Float32Array(COUNT * 3)
      const sizes = new Float32Array(COUNT)

      const colorViolet = hexToVec3('#8b5cf6')
      const colorAmber = hexToVec3('#f59e0b')
      const colorRose = hexToVec3('#f43f5e')

      for (let i = 0; i < COUNT; i++) {
        const x = (Math.random() - 0.5) * 50
        const y = (Math.random() - 0.5) * 36
        const z = (Math.random() - 0.5) * 60 - 5

        positions[i * 3] = x
        positions[i * 3 + 1] = y
        positions[i * 3 + 2] = z

        sizes[i] = Math.random() < 0.2 ? 14 + Math.random() * 12 : 5 + Math.random() * 8

        const dice = Math.random()
        let c = colorViolet
        if (dice > 0.8) c = colorAmber
        else if (dice > 0.6) c = colorRose

        colors[i * 3] = c.x
        colors[i * 3 + 1] = c.y
        colors[i * 3 + 2] = c.z
      }

      starGeo = new THREE.BufferGeometry()
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      starMaterial = new THREE.ShaderMaterial({
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true,
        uniforms: {
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uMouse: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
          attribute float size;
          uniform float uTime;
          uniform float uScroll;
          uniform vec2 uMouse;
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vColor = color;
            vec3 pos = position;

            // Ambient gentle floating motion
            pos.y += sin(uTime * 0.45 + pos.x * 0.18) * 0.8;
            pos.x += cos(uTime * 0.35 + pos.y * 0.14) * 0.6;

            // Scroll depth drift
            float zOffset = mod(pos.z + uScroll * 45.0 + 35.0, 65.0) - 35.0;
            pos.z = zOffset;

            // Parallax tracking
            pos.x += uMouse.x * 2.2 * (1.0 + abs(pos.z) * 0.03);
            pos.y += uMouse.y * 1.8 * (1.0 + abs(pos.z) * 0.03);

            vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            float dist = -mvPosition.z;
            vAlpha = smoothstep(65.0, 16.0, dist) * smoothstep(1.0, 6.0, dist);

            gl_PointSize = size * (14.0 / max(dist, 1.0));
            gl_PointSize = clamp(gl_PointSize, 1.8, 38.0);
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 coord = gl_PointCoord - 0.5;
            float r = length(coord);
            if (r > 0.5) discard;

            float glow = smoothstep(0.5, 0.0, r);
            float core = smoothstep(0.18, 0.0, r);

            vec3 finalColor = vColor + vec3(core * 0.35);
            gl_FragColor = vec4(finalColor, glow * vAlpha * 0.85);
          }
        `,
      })

      const starPoints = new THREE.Points(starGeo, starMaterial)
      starPoints.frustumCulled = false
      scene.add(starPoints)

      const animateWebGL = () => {
        if (isDisposed) return
        animationFrameId = requestAnimationFrame(animateWebGL)

        if (document.hidden) return

        const t = performance.now() / 1000

        scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.08)
        scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.05)

        mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06)
        mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06)

        camera!.position.x = mouse.x * 0.7
        camera!.position.y = mouse.y * 0.5
        camera!.lookAt(0, 0, -10)

        starMaterial!.uniforms.uTime.value = t
        starMaterial!.uniforms.uScroll.value = scrollCurrent
        starMaterial!.uniforms.uMouse.value.set(mouse.x, mouse.y)

        renderer!.render(scene!, camera!)
      }

      const onVisibility = () => {
        if (!document.hidden && !isDisposed) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = requestAnimationFrame(animateWebGL)
        }
      }
      document.addEventListener('visibilitychange', onVisibility)

      animateWebGL()

      return () => {
        isDisposed = true
        cancelAnimationFrame(animationFrameId)
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('resize', onResize)
        document.removeEventListener('visibilitychange', onVisibility)

        if (starGeo) starGeo.dispose()
        if (starMaterial) starMaterial.dispose()
        if (renderer) renderer.dispose()
      }
    }

    // B) 2D CANVAS FALLBACK PATH (Guarantees animations never fail under any environment)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = curW * dpr
    canvas.height = curH * dpr

    const COUNT_2D = 180
    const particles = Array.from({ length: COUNT_2D }, () => ({
      x: Math.random() * curW,
      y: Math.random() * curH,
      z: Math.random() * 2 + 0.5,
      radius: Math.random() < 0.2 ? Math.random() * 2.5 + 2 : Math.random() * 1.5 + 0.8,
      color: Math.random() > 0.75 ? '#f59e0b' : Math.random() > 0.45 ? '#8b5cf6' : '#ec4899',
      speedX: (Math.random() - 0.5) * 0.35,
      speedY: (Math.random() - 0.5) * 0.35,
      phase: Math.random() * Math.PI * 2,
    }))

    const animate2D = () => {
      if (isDisposed) return
      animationFrameId = requestAnimationFrame(animate2D)

      if (document.hidden) return

      const t = performance.now() / 1000

      scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.08)
      scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.05)

      mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06)
      mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06)

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.scale(dpr, dpr)

      const mouseOffsetX = mouse.x * 24
      const mouseOffsetY = mouse.y * 18

      for (let i = 0; i < COUNT_2D; i++) {
        const p = particles[i]
        p.x += p.speedX + Math.sin(t * 0.5 + p.phase) * 0.2
        p.y += p.speedY + Math.cos(t * 0.4 + p.phase) * 0.2 - scrollCurrent * 1.5 * p.z

        // Wrap around boundaries
        if (p.x < 0) p.x = curW
        if (p.x > curW) p.x = 0
        if (p.y < 0) p.y = curH
        if (p.y > curH) p.y = 0

        const drawX = p.x + mouseOffsetX * (p.z * 0.5)
        const drawY = p.y + mouseOffsetY * (p.z * 0.5)

        const alpha = 0.45 + Math.sin(t * 1.2 + p.phase) * 0.35

        ctx.beginPath()
        ctx.arc(drawX, drawY, p.radius * p.z, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0.1, Math.min(0.9, alpha))
        ctx.shadowBlur = 8
        ctx.shadowColor = p.color
        ctx.fill()
      }

      ctx.restore()
    }

    const onVisibility2D = () => {
      if (!document.hidden && !isDisposed) {
        cancelAnimationFrame(animationFrameId)
        animationFrameId = requestAnimationFrame(animate2D)
      }
    }
    document.addEventListener('visibilitychange', onVisibility2D)

    animate2D()

    return () => {
      isDisposed = true
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility2D)
    }
  }, [])

  return (
    <div className="cyber-3d-background" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-tunnel-canvas" />
      {/* Dynamic Ambient Corner Flames */}
      <div className="corner-flame top-left" />
      <div className="corner-flame top-right" />
      <div className="corner-flame bottom-left" />
      <div className="corner-flame bottom-right" />
    </div>
  )
}
