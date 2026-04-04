import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../context/ThemeContext';

const HeroBackground: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const mouse = useRef({ x: 0, y: 0 });
  const pointsRef = useRef<THREE.Points | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true,
      powerPreference: 'high-performance'
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Symbolism: The "Intelligence Sphere" - A global network of data points
    const particleCount = 250;
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    const radius = 6;
    for (let i = 0; i < particleCount; i++) {
      // Distribute points in a spherical shell
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;

      velocities[i * 3] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const initialColor = theme === 'dark' ? 0x3B82F6 : 0x1E293B;
    const material = new THREE.PointsMaterial({
      color: initialColor,
      size: 0.08,
      transparent: true,
      opacity: 0.8,
    });

    const points = new THREE.Points(geometry, material);
    pointsRef.current = points;
    scene.add(points);

    // Lines for the "Neural Network" effect
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: initialColor,
      transparent: true,
      opacity: 0.15,
    });
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    linesRef.current = lines;
    scene.add(lines);

    camera.position.z = 12;

    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.002;

      const pos = geometry.attributes.position.array as Float32Array;
      const linePositions: number[] = [];

      // Rotate the entire sphere slowly
      points.rotation.y += 0.001;
      points.rotation.x += 0.0005;
      lines.rotation.y = points.rotation.y;
      lines.rotation.x = points.rotation.x;

      for (let i = 0; i < particleCount; i++) {
        // Gentle organic movement
        pos[i * 3] += Math.sin(time + i) * 0.002;
        pos[i * 3 + 1] += Math.cos(time + i) * 0.002;
        pos[i * 3 + 2] += Math.sin(time * 0.5 + i) * 0.002;

        // Mouse interaction: "Intelligence Attraction"
        // Points lean towards the mouse, symbolizing focus
        const targetX = mouse.current.x * 8;
        const targetY = mouse.current.y * 8;
        
        const dx = pos[i * 3] - targetX;
        const dy = pos[i * 3 + 1] - targetY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 5) {
          const force = (5 - dist) / 5;
          pos[i * 3] -= dx * force * 0.02;
          pos[i * 3 + 1] -= dy * force * 0.02;
        } else {
          // Return to original relative position
          const ox = originalPositions[i * 3];
          const oy = originalPositions[i * 3 + 1];
          const oz = originalPositions[i * 3 + 2];
          
          pos[i * 3] += (ox - pos[i * 3]) * 0.01;
          pos[i * 3 + 1] += (oy - pos[i * 3 + 1]) * 0.01;
          pos[i * 3 + 2] += (oz - pos[i * 3 + 2]) * 0.01;
        }

        // Connect lines to nearby points (The Network)
        for (let j = i + 1; j < particleCount; j++) {
          const dxLine = pos[i * 3] - pos[j * 3];
          const dyLine = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dzLine = pos[i * 3 + 2] - pos[j * 3 + 2];
          const distLine = Math.sqrt(dxLine * dxLine + dyLine * dyLine + dzLine * dzLine);

          if (distLine < 2.8) {
            linePositions.push(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
            linePositions.push(pos[j * 3], pos[j * 3 + 1], pos[j * 3 + 2]);
          }
        }
      }

      geometry.attributes.position.needsUpdate = true;
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const color = theme === 'dark' ? 0x3B82F6 : 0x1E293B;
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.PointsMaterial).color.setHex(color);
    }
    if (linesRef.current) {
      (linesRef.current.material as THREE.LineBasicMaterial).color.setHex(color);
    }
  }, [theme]);

  return (
    <div ref={containerRef} className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-blue/5 to-transparent opacity-20 animate-pulse pointer-events-none" />
      <div className="scanline opacity-20 pointer-events-none" />
    </div>
  );
};

export default HeroBackground;
