/* ============================================================
   3D hero scene — faceted glass crystal, dust field, orbital rings
   three.js r187
   ============================================================ */

import * as THREE from "https://esm.sh/three@0.187.0";

const canvas = document.getElementById("scene");
const hero = document.querySelector(".hero");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const desktop = window.matchMedia("(min-width: 1024px)");

if (canvas && hero) {
  try {
    start();
  } catch (error) {
    canvas.style.display = "none";
    console.warn("3D scene disabled:", error);
  }
}

function start() {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, desktop.matches ? 1.75 : 1.35));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 7.6);

  const group = new THREE.Group();
  scene.add(group);

  const LIME = new THREE.Color(0xb6ff3c);
  const COOL = new THREE.Color(0x5ed6ff);

  // ---- faceted glass shell ----
  const shellGeometry = new THREE.IcosahedronGeometry(1.72, 1);
  const flatGeometry = shellGeometry.index ? shellGeometry.toNonIndexed() : shellGeometry;
  flatGeometry.computeVertexNormals();

  const shellMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uRim: { value: LIME.clone() },
      uCool: { value: COOL.clone() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vNormal = normalize(mat3(modelMatrix) * normal);
        vViewDir = normalize(cameraPosition - world.xyz);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uRim;
      uniform vec3 uCool;
      varying vec3 vNormal;
      varying vec3 vViewDir;

      void main() {
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewDir);
        float facing = clamp(dot(N, V), 0.0, 1.0);
        float fres = pow(1.0 - facing, 2.1);

        float band = smoothstep(-0.75, 0.85, N.y);
        vec3 base = mix(vec3(0.012, 0.02, 0.016), uCool * 0.26, band);

        float spec = pow(max(dot(N, normalize(vec3(0.35, 0.8, 0.45))), 0.0), 22.0);
        float spec2 = pow(max(dot(N, normalize(vec3(-0.6, -0.3, 0.6))), 0.0), 34.0);

        vec3 colour = base;
        colour += mix(uRim, uCool, fres * 0.55) * fres * 1.02;
        colour += vec3(1.0) * spec * 1.15;
        colour += uCool * spec2 * 0.6;
        colour += uRim * 0.04 * (0.5 + 0.5 * sin(uTime * 0.9 + N.x * 7.0 + N.z * 4.0));

        gl_FragColor = vec4(colour, 0.07 + fres * 0.86);
      }
    `,
  });

  const shell = new THREE.Mesh(flatGeometry, shellMaterial);
  group.add(shell);

  // ---- inner core ----
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.6, 0),
    new THREE.MeshBasicMaterial({
      color: 0xb6ff3c,
      wireframe: true,
      transparent: true,
      opacity: 0.9,
    })
  );
  group.add(core);

  // ---- outer halo ----
  const halo = new THREE.Mesh(
    new THREE.IcosahedronGeometry(2.32, 0),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
    })
  );
  group.add(halo);

  // ---- orbital rings ----
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xb6ff3c,
    transparent: true,
    opacity: 0.32,
  });
  const ringMaterialSoft = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
  });

  const rings = [];
  const ringSpecs = [
    { radius: 2.55, tilt: [1.2, 0.1, 0.3], material: ringMaterial },
    { radius: 2.95, tilt: [1.05, -0.55, 0.9], material: ringMaterialSoft },
    { radius: 3.35, tilt: [1.45, 0.7, -0.2], material: ringMaterialSoft },
  ];

  for (const spec of ringSpecs) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.004, 6, 180), spec.material);
    ring.rotation.set(spec.tilt[0], spec.tilt[1], spec.tilt[2]);
    rings.push(ring);
    group.add(ring);
  }

  // ---- dust ----
  const dustCount = desktop.matches ? 900 : 420;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    const radius = 3.2 + Math.random() * 6.4;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    dustPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    dustPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
    dustPositions[i * 3 + 2] = radius * Math.cos(phi) * 0.7;
  }

  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(
    dustGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.022,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
      depthWrite: false,
    })
  );
  scene.add(dust);

  // ---- layout ----
  const layout = () => {
    const rect = hero.getBoundingClientRect();
    const width = rect.width || window.innerWidth;
    const height = rect.height || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    if (desktop.matches) {
      group.position.set(2.1, 0.15, 0);
      group.scale.setScalar(1);
      dust.position.set(1.4, 0, 0);
    } else if (width >= 768) {
      group.position.set(1.35, 0.1, -0.3);
      group.scale.setScalar(0.9);
      dust.position.set(1, 0, 0);
    } else {
      group.position.set(0, 0.2, -0.9);
      group.scale.setScalar(0.72);
      dust.position.set(0, 0, 0);
    }
  };

  // ---- interaction state ----
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const drag = { active: false, lastX: 0, lastY: 0, velX: 0, velY: 0 };
  let scrollRotation = 0;

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;

    if (drag.active) {
      drag.velX += (event.clientX - drag.lastX) * 0.00055;
      drag.velY += (event.clientY - drag.lastY) * 0.00055;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
    }
  };

  const onPointerDown = (event) => {
    drag.active = true;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
  };

  const onPointerUp = () => {
    drag.active = false;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp, { passive: true });
  window.addEventListener("pointercancel", onPointerUp, { passive: true });
  window.addEventListener("scroll", () => {
    scrollRotation = window.scrollY * 0.0009;
  }, { passive: true });

  // ---- visibility + loop ----
  let visible = true;
  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.02 }
  );
  visibilityObserver.observe(hero);

  const clock = {
    startTime: performance.now(),
    last: performance.now(),
    elapsedTime: 0,
    getDelta() {
      const now = performance.now();
      const delta = (now - this.last) / 1000;
      this.last = now;
      this.elapsedTime = (now - this.startTime) / 1000;
      return delta;
    },
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && visible) clock.last = performance.now();
  });

  let frames = 0;
  let fpsWindow = 0;
  let degraded = false;

  const render = () => {
    const delta = Math.min(clock.getDelta(), 0.05);
    const time = clock.elapsedTime;

    if (!reduceMotion.matches) {
      target.x += (pointer.y * 0.22 - target.x) * 0.05;
      target.y += (pointer.x * 0.38 - target.y) * 0.05;

      drag.velX *= 0.94;
      drag.velY *= 0.94;

      group.rotation.x = target.x + drag.velY + Math.sin(time * 0.24) * 0.06;
      group.rotation.y = target.y + drag.velX + time * 0.12 + scrollRotation;
      group.rotation.z = Math.sin(time * 0.18) * 0.05;

      core.rotation.x = -time * 0.45;
      core.rotation.y = time * 0.38;

      halo.rotation.y = -time * 0.08;
      halo.rotation.x = time * 0.05;

      rings.forEach((ring, index) => {
        ring.rotation.z += delta * (index % 2 === 0 ? 0.09 : -0.06);
      });

      dust.rotation.y = time * 0.022;
      dust.rotation.x = Math.sin(time * 0.1) * 0.05;

      camera.position.x = pointer.x * 0.22;
      camera.position.y = -pointer.y * 0.16;
      camera.lookAt(0, 0, 0);
    }

    shellMaterial.uniforms.uTime.value = time;
    renderer.render(scene, camera);

    // drop quality once if the first frames run slow
    frames += 1;
    fpsWindow += delta;
    if (!degraded && fpsWindow > 1.6) {
      if (frames / fpsWindow < 42) {
        degraded = true;
        renderer.setPixelRatio(1);
        dust.material.size = 0.016;
      }
      frames = 0;
      fpsWindow = 0;
    }
  };

  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    render();
  });

  layout();

  const resizeObserver = new ResizeObserver(layout);
  resizeObserver.observe(hero);
  window.addEventListener("resize", layout, { passive: true });
  desktop.addEventListener("change", layout);

  reduceMotion.addEventListener("change", () => {
    layout();
    render();
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    canvas.style.display = "none";
  });

  render();
}
