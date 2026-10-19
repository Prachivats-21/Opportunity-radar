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
    const w = window.innerWidth
    const h = window.innerHeight

    // 1. Scene & Camera
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0A0E17, 15, 60)

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 400)
    camera.position.set(0, 0, 18)
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
      return // Graceful fallback
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)

    // 3. Scattered Atmospheric Cosmic Particles (No black hole, pure scattered cosmic dust)
    const COUNT = 750
    const positions = new Float32Array(COUNT * 3)
    const basePositions = new Float32Array(COUNT * 3)
    const colors = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)

    const colorEmerald = hexToVec3('#10b981')
    const colorCyan = hexToVec3('#38bdf8')
    const colorAmber = hexToVec3('#f59e0b')

    for (let i = 0; i < COUNT; i++) {
      // Wide scattering across the entire screen and depth
      const x = (Math.random() - 0.5) * 44
      const y = (Math.random() - 0.5) * 32
      const z = (Math.random() - 0.5) * 50 - 5

      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      basePositions[i * 3] = x
      basePositions[i * 3 + 1] = y
      basePositions[i * 3 + 2] = z

      // Size distribution: mostly small delicate motes, few brighter stars
      sizes[i] = Math.random() < 0.15 ? 18 + Math.random() * 12 : 6 + Math.random() * 10

      // Color variation: 65% emerald, 25% cyan, 10% amber
      const dice = Math.random()
      let c = colorEmerald
      if (dice > 0.88) {
        c = colorAmber
      } else if (dice > 0.65) {
        c = colorCyan
      }

      colors[i * 3] = c.x
      colors[i * 3 + 1] = c.y
      colors[i * 3 + 2] = c.z
    }

    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const starMaterial = new THREE.ShaderMaterial({
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

          // Gentle ambient wave motion
          pos.y += sin(uTime * 0.4 + pos.x * 0.15) * 0.7;
          pos.x += cos(uTime * 0.3 + pos.y * 0.12) * 0.5;

          // Scroll depth warp: particles drift past as user scrolls
          float zOffset = mod(pos.z + uScroll * 40.0 + 35.0, 60.0) - 35.0;
          pos.z = zOffset;

          // Mouse tilt parallax
          pos.x += uMouse.x * 2.5 * (1.0 + abs(pos.z) * 0.04);
          pos.y += uMouse.y * 2.0 * (1.0 + abs(pos.z) * 0.04);

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;

          // Soft distance fade
          float dist = -mvPosition.z;
          vAlpha = smoothstep(55.0, 18.0, dist) * smoothstep(1.5, 6.0, dist);

          gl_PointSize = size * (12.0 / max(dist, 1.0));
          gl_PointSize = clamp(gl_PointSize, 1.5, 36.0);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 coord = gl_PointCoord - 0.5;
          float r = length(coord);
          if (r > 0.5) discard;

          // Glowing soft radial gradient
          float glow = smoothstep(0.5, 0.0, r);
          float core = smoothstep(0.18, 0.0, r);

          vec3 finalColor = vColor + vec3(core * 0.4);
          gl_FragColor = vec4(finalColor, glow * vAlpha * 0.75);
        }
      `,
    })

    const starPoints = new THREE.Points(starGeo, starMaterial)
    starPoints.frustumCulled = false
    scene.add(starPoints)

    // 4. Interaction State (Scroll & Mouse Damping)
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
      const curW = window.innerWidth
      const curH = window.innerHeight
      camera.aspect = curW / curH
      camera.updateProjectionMatrix()
      renderer.setSize(curW, curH, false)
      onScroll()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('resize', onResize)

    // 5. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const t = performance.now() / 1000

      // Smooth scroll & mouse lerp
      scrollSmooth = Lerp(scrollSmooth, scrollTarget, 0.08)
      scrollCurrent = Lerp(scrollCurrent, scrollSmooth, 0.05)

      mouse.x = Lerp(mouse.x, mouseTarget.x, 0.06)
      mouse.y = Lerp(mouse.y, mouseTarget.y, 0.06)

      // Camera gently tracks mouse parallax
      camera.position.x = mouse.x * 0.8
      camera.position.y = mouse.y * 0.6
      camera.lookAt(0, 0, -10)

      // Update uniforms
      starMaterial.uniforms.uTime.value = t
      starMaterial.uniforms.uScroll.value = scrollCurrent
      starMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y)

      renderer.render(scene, camera)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)

      starGeo.dispose()
      starMaterial.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div className="cyber-3d-background" aria-hidden="true">
      <canvas ref={canvasRef} className="cyber-tunnel-canvas" />
      {/* Subtle corner ambience */}
      <div className="corner-flame top-left" />
      <div className="corner-flame top-right" />
      <div className="corner-flame bottom-left" />
      <div className="corner-flame bottom-right" />
    </div>
  )
}
