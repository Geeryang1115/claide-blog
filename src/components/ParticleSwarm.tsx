import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const PARTICLE_COUNT = 8000

const vertexShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uRadius;
  
  varying float vDist;
  varying float vMouseDist;
  
  void main() {
    vec3 pos = position;
    
    // Create two orbiting axes
    float angle1 = uTime * 0.3 + pos.x * 0.5;
    float angle2 = uTime * 0.2 + pos.y * 0.3;
    
    // Rotation matrix 1 (around Y)
    mat3 rotY = mat3(
      cos(angle1), 0.0, sin(angle1),
      0.0, 1.0, 0.0,
      -sin(angle1), 0.0, cos(angle1)
    );
    
    // Rotation matrix 2 (around X)
    mat3 rotX = mat3(
      1.0, 0.0, 0.0,
      0.0, cos(angle2), -sin(angle2),
      0.0, sin(angle2), cos(angle2)
    );
    
    // Apply rotations
    pos = rotY * pos;
    pos = rotX * pos;
    
    // Z-axis wave
    pos.z += sin(uTime * 0.5 + pos.x * 2.0) * 0.15;
    
    // Mouse repulsion
    vec2 mousePos = uMouse;
    float mouseDist = distance(pos.xy, mousePos);
    if (mouseDist < 1.3) {
      vec2 repelDir = normalize(pos.xy - mousePos);
      float repelStrength = (1.3 - mouseDist) * 0.4;
      pos.xy += repelDir * repelStrength;
    }
    
    // Calculate distance from center for size and color
    float dist = length(pos);
    vDist = dist;
    vMouseDist = mouseDist;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Point size based on distance from center
    float size = 2.0 + smoothstep(0.0, 1.5, dist) * 3.0;
    gl_PointSize = size * (10.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  
  varying float vDist;
  varying float vMouseDist;
  
  void main() {
    // Create circular point
    vec2 coord = gl_PointCoord - 0.5;
    float len = length(coord);
    if (len > 0.5) discard;
    
    // Smooth circle edge
    float alpha = 1.0 - smoothstep(0.3, 0.5, len);
    
    // Color mixing based on distance from center
    vec3 color;
    if (vDist < 0.6) {
      color = mix(uColor2, uColor1, vDist / 0.6);
    } else {
      color = mix(uColor1, uColor3, (vDist - 0.6) / 1.4);
    }
    
    // Mouse highlight
    if (vMouseDist < 1.3) {
      float highlight = (1.3 - vMouseDist) * 0.3;
      color += vec3(highlight);
    }
    
    // Fade far particles
    alpha *= 1.0 - smoothstep(1.5, 2.5, vDist);
    
    gl_FragColor = vec4(color, alpha * 0.8);
  }
`

// Global mouse state that persists across renders
const mouseState = { x: 0, y: 0 }

function Particles() {
  const pointsRef = useRef<THREE.Points>(null)
  const smoothMouse = useRef(new THREE.Vector2(0, 0))

  const { positions, uniforms } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      // Distribute particles in a sphere-like volume
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.cbrt(Math.random()) * 2.5
      
      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = r * Math.cos(phi)
    }
    
    const uniforms = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uRadius: { value: 0.8 },
      uColor1: { value: new THREE.Color('#7B61FF') },
      uColor2: { value: new THREE.Color('#FF8C42') },
      uColor3: { value: new THREE.Color('#030305') },
    }
    
    return { positions, uniforms }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current) return
    
    const material = pointsRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = state.clock.elapsedTime * 0.5
    
    // Smooth mouse follow with lerp
    smoothMouse.current.x += (mouseState.x - smoothMouse.current.x) * 0.05
    smoothMouse.current.y += (mouseState.y - smoothMouse.current.y) * 0.05
    material.uniforms.uMouse.value.copy(smoothMouse.current)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function Scene() {
  return (
    <>
      <Particles />
    </>
  )
}

export default function ParticleSwarm() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse to [-1.5, 1.5] range for the shader
      mouseState.x = (e.clientX / window.innerWidth - 0.5) * 3
      mouseState.y = -(e.clientY / window.innerHeight - 0.5) * 3
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
