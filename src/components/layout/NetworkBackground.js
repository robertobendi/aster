import { useState, useEffect, useRef } from 'react';
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Color,
  BufferGeometry,
  BufferAttribute,
  PointsMaterial,
  Points,
  LineBasicMaterial,
  LineDashedMaterial,
  Line,
  Group,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  Vector3,
  CubicBezierCurve3,
  LinearFilter,
  AdditiveBlending,
  Float32BufferAttribute
} from 'three';

const NetworkBackground = ({ className = "" }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Check for WebGL support
    let renderer;
    try {
      renderer = new WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        powerPreference: "high-performance",
        alpha: true
      });
    } catch (e) {
      console.error("WebGL not supported");
      return;
    }

    const scene = new Scene();
    scene.background = new Color('#000000');
    const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    function hslToRgb(h, s, l) {
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      return [r, g, b];
    }

    const createText = (text, size = 32) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 512;
      canvas.height = 128;
      ctx.font = `bold ${size}px 'Inter', -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 256, 64);
      
      const texture = new CanvasTexture(canvas);
      texture.minFilter = LinearFilter;
      const material = new SpriteMaterial({ map: texture, transparent: true });
      const sprite = new Sprite(material);
      const baseSize = Math.random() < 0.1 ? 24 : 16;
      sprite.scale.set(baseSize, baseSize / 4, 1);
      return sprite;
    };

    const createGalaxyCloud = (center, radius, count = 150) => {
      const geometry = new BufferGeometry();
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const arms = 3 + Math.floor(Math.random() * 2);
      const armOffset = 2 * Math.PI / arms;
      const rotationFactor = 3;
      
      // All white particles
      const baseHue = 0;
      const baseSaturation = 0;
      
      for (let i = 0; i < count * 3; i += 3) {
        const progress = (i / count) * 5;
        const arm = Math.floor(Math.random() * arms);
        const angle = (progress * Math.PI) + (arm * armOffset);
        
        const randomOffset = Math.random() * 0.4;
        const distanceFromCenter = (progress / 5) * radius * (0.2 + randomOffset);
        
        const spiralX = Math.cos(angle + (distanceFromCenter / radius) * rotationFactor) * distanceFromCenter;
        const spiralY = Math.sin(angle + (distanceFromCenter / radius) * rotationFactor) * distanceFromCenter;
        const heightVariation = (Math.random() - 0.5) * radius * 0.15;
        
        positions[i] = center.x + spiralX;
        positions[i + 1] = center.y + spiralY;
        positions[i + 2] = center.z + heightVariation;

        // Pure white with varying brightness
        const brightness = 0.5 + Math.random() * 0.5;
        const rgb = hslToRgb(baseHue, baseSaturation, brightness);
        colors[i] = rgb[0];
        colors[i + 1] = rgb[1];
        colors[i + 2] = rgb[2];

        const distanceRatio = distanceFromCenter / radius;
        if (Math.random() < 0.015 * (1 - distanceRatio)) {
          const tagNumber = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
          const tag = createText(`#${tagNumber}`, 16);
          tag.position.set(positions[i], positions[i + 1], positions[i + 2]);
          scene.add(tag);
        }
      }
      
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setAttribute('color', new BufferAttribute(colors, 3));
      
      const material = new PointsMaterial({
        size: 0.6,
        transparent: true,
        opacity: 0.6,
        vertexColors: true,
        blending: AdditiveBlending,
        sizeAttenuation: true
      });
      
      return new Points(geometry, material);
    };

    const createClusterBoundary = (radius, position) => {
      const group = new Group();
      
      for (let i = 0; i < 3; i++) {
        const scale = 1 - (i * 0.1);
        const opacity = 0.3 - (i * 0.08);
        const circle = new Line(
          new BufferGeometry().setFromPoints(
            new Array(64).fill().map((_, j) => {
              const theta = (j / 32) * Math.PI * 2;
              const scaleY = 0.8 * scale;
              return new Vector3(
                Math.cos(theta) * radius * scale,
                Math.sin(theta) * radius * scaleY,
                i * 5
              );
            })
          ),
          // Pure white for lines
          new LineBasicMaterial({ color: '#ffffff', transparent: true, opacity })
        );
        group.add(circle);
      }

      const cloud = createGalaxyCloud(position, radius * 1.2, 200);
      group.add(cloud);

      for (let i = 0; i < 2; i++) {
        const detailCloud = createGalaxyCloud(position, radius * 0.6, 50);
        detailCloud.position.z += (i + 1) * 10;
        group.add(detailCloud);
      }

      group.position.copy(position);
      return group;
    };

    const nodeTypes = ['■', '●', '▲', '◆', '★', '⌘', '⚠', '◎', '※', '⌬'];
    
    const groups = [
      { name: "CENTRAL NEXUS", radius: 30, position: new Vector3(0, 0, 0) },
      { name: "DATA CLUSTER", radius: 25, position: new Vector3(-50, 30, -20) },
      { name: "COMMAND NET", radius: 25, position: new Vector3(50, -30, 20) },
      { name: "PROCESSING", radius: 20, position: new Vector3(-20, -50, -30) }
    ];

    groups.forEach(group => {
      const boundary = createClusterBoundary(group.radius, group.position);
      scene.add(boundary);

      const label = createText(group.name, 48);
      label.position.copy(group.position);
      label.position.y += group.radius + 5;
      scene.add(label);
    });

    const createNodes = () => {
      const nodes = [];
      
      groups.forEach(group => {
        const count = 10 + Math.floor(Math.random() * 8);
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 4;
          const progress = i / count;
          const layerRadius = group.radius * (0.3 + progress * 0.7);
          const position = new Vector3(
            group.position.x + Math.cos(angle) * layerRadius,
            group.position.y + Math.sin(angle) * layerRadius,
            group.position.z + (Math.random() - 0.5) * group.radius * 0.2
          );

          const nodeType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)];
          const label = createText(`${nodeType} ${group.name.charAt(0)}${i}`, 24);
          label.position.copy(position);

          nodes.push({
            position,
            basePosition: position.clone(),
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 0.5,
            amplitude: 1 + Math.random() * 2,
            label
          });
          scene.add(label);

          if (Math.random() < 0.05) {
            const arrow = createText('→', 32);
            arrow.position.copy(position).add(new Vector3(3, 0, 0));
            arrow.scale.set(4, 4, 1);
            scene.add(arrow);
          }
        }
      });
      return nodes;
    };

    const createConnections = (nodes) => {
      const connections = [];
      const lineTypes = [
        { material: new LineBasicMaterial({ 
          color: '#ffffff', 
          transparent: true, 
          opacity: 0.4,
          blending: AdditiveBlending 
        })},
        { material: new PointsMaterial({ 
          color: '#ffffff', 
          size: 0.2, 
          transparent: true, 
          opacity: 0.2,
          blending: AdditiveBlending 
        })}
      ];

      nodes.forEach((node, i) => {
        nodes.slice(i + 1).forEach(other => {
          if (node.position.distanceTo(other.position) < 40 && Math.random() < 0.15) {
            const type = lineTypes[Math.floor(Math.random() * lineTypes.length)];
            const geometry = new BufferGeometry();
            
            if (type.material instanceof PointsMaterial) {
              const points = [];
              for (let i = 0; i <= 10; i++) {
                const progress = i / 10;
                const point = new Vector3().lerpVectors(
                  node.position,
                  other.position,
                  progress
                );
                // Add slight arc to connections
                point.z += Math.sin(progress * Math.PI) * 2;
                points.push(point);
              }
              geometry.setFromPoints(points);
            } else {
              const midPoint = new Vector3().lerpVectors(node.position, other.position, 0.5);
              midPoint.z += 2; // Add slight arc
              geometry.setFromPoints([node.position, midPoint, other.position]);
            }
            
            const line = type.material instanceof PointsMaterial ?
              new Points(geometry, type.material) :
              new Line(geometry, type.material);
            
            connections.push({ line, start: node, end: other });
            scene.add(line);
          }
        });
      });
      return connections;
    };

    const nodes = createNodes();
    const connections = createConnections(nodes);

    camera.position.set(0, 0, 60);
    let time = 0;
    let cameraTarget = new Vector3();
    let currentGroupIndex = 0;
    let lastFrameTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastFrameTime) / 1000;
      lastFrameTime = currentTime;

      time += deltaTime * 0.3;

      nodes.forEach(node => {
        const offset = new Vector3(
          Math.sin(time * node.speed + node.phase) * node.amplitude,
          Math.cos(time * node.speed + node.phase) * node.amplitude,
          Math.sin(time * node.speed * 0.5 + node.phase) * node.amplitude
        );
        node.label.position.copy(node.basePosition).add(offset);
      });

      connections.forEach(conn => {
        if (conn.line instanceof Points) {
          const points = [];
          for (let i = 0; i <= 10; i++) {
            const progress = i / 10;
            const point = new Vector3().lerpVectors(
              conn.start.label.position,
              conn.end.label.position,
              progress
            );
            point.z += Math.sin(progress * Math.PI) * 2;
            points.push(point);
          }
          conn.line.geometry.setFromPoints(points);
        } else {
          const midPoint = new Vector3().lerpVectors(
            conn.start.label.position,
            conn.end.label.position,
            0.5
          );
          midPoint.z += 2;
          conn.line.geometry.setFromPoints([
            conn.start.label.position,
            midPoint,
            conn.end.label.position
          ]);
        }
      });

      const targetGroup = groups[currentGroupIndex];
      cameraTarget.lerp(targetGroup.position, 0.02);
      
      camera.position.x = cameraTarget.x + Math.sin(time * 0.3) * 25;
      camera.position.y = cameraTarget.y + Math.cos(time * 0.4) * 25;
      camera.position.z = cameraTarget.z + 25 + Math.sin(time * 0.2) * 15;
      
      if (time % 10 < 0.01) {
        currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      }

      camera.lookAt(cameraTarget);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationId);
        if (renderer) {
          renderer.dispose();
          scene.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }
      };
    }, []);
  
    return (
      <canvas 
        ref={canvasRef} 
        className={`fixed top-0 left-0 w-full h-full ${className}`}
      />
    );
  };
  
  export default NetworkBackground;