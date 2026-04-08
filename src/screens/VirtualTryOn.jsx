import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  API_BASE,
  fallbackProducts,
  getPrimaryImage,
  getProductColors,
  getProductImages,
} from "../utils/shop";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (a, b, t) => a + (b - a) * t;
const degRad = (d) => (Number(d || 0) * Math.PI) / 180;

// ─── Auto-orient: find rotation that makes model widest on X axis ─────────────
const findBestOrientation = (object) => {
  const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
  const saved = object.rotation.clone();
  let best = { rx: 0, ry: 0, rz: 0, score: -Infinity };

  for (const rx of [0, Math.PI / 2, -Math.PI / 2]) {
    for (const ry of angles) {
      for (const rz of angles) {
        object.rotation.set(rx, ry, rz);
        object.updateMatrixWorld(true);
        const s = new THREE.Vector3();
        new THREE.Box3().setFromObject(object).getSize(s);
        const W = Math.max(s.x, 1e-4),
          H = Math.max(s.y, 1e-4),
          D = Math.max(s.z, 1e-4);
        const score = (W / H) * 2.4 + W / D - D * 0.18;
        if (score > best.score) best = { rx, ry, rz, score };
      }
    }
  }
  object.rotation.copy(saved);
  object.updateMatrixWorld(true);
  return best;
};

// ─── Component ────────────────────────────────────────────────────────────────
const VirtualTryOn = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  // ── refs ────────────────────────────────────────────────────────────────────
  const videoRef = useRef(null);
  const canvasRef = useRef(null); // direct <canvas> ref — no mount div needed
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const anchorRef = useRef(null);
  const wrapperRef = useRef(null);
  const modelRef = useRef(null);
  const autoFitRef = useRef({
    rx: 0,
    ry: 0,
    rz: 0,
    offsetY: -0.04,
    offsetZ: 0,
    scaleMul: 1.7,
  });
  const lastTimeRef = useRef(-1);
  const smoothRef = useRef(null);
  const containerSizeRef = useRef({ w: 0, h: 0 });

  // ── state ───────────────────────────────────────────────────────────────────
  const [products, setProducts] = useState(fallbackProducts);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [trackingMsg, setTrackingMsg] = useState("Preparing camera…");
  const [assetMsg, setAssetMsg] = useState("Loading 3D asset…");
  const [autoFitTick, setAutoFitTick] = useState(0);
  const [adjustments, setAdjustments] = useState({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    tilt: 0,
  });
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // ── product data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length) setProducts(data);
      } catch {}
    })();
  }, []);

  const product = useMemo(
    () => products.find((p) => p._id === productId) || fallbackProducts[0],
    [productId, products],
  );
  const images = useMemo(() => getProductImages(product), [product]);
  const colors = useMemo(() => getProductColors(product), [product]);

  const modelCal = useMemo(
    () => ({
      scaleMul:
        product.tryOnModelScaleMultiplier != null &&
        product.tryOnModelScaleMultiplier !== ""
          ? Number(product.tryOnModelScaleMultiplier)
          : autoFitRef.current.scaleMul,
      offsetY:
        product.tryOnModelOffsetY != null && product.tryOnModelOffsetY !== ""
          ? Number(product.tryOnModelOffsetY)
          : autoFitRef.current.offsetY,
      offsetZ:
        product.tryOnModelOffsetZ != null && product.tryOnModelOffsetZ !== ""
          ? Number(product.tryOnModelOffsetZ)
          : autoFitRef.current.offsetZ,
      rx:
        product.tryOnModelRotationX != null &&
        product.tryOnModelRotationX !== ""
          ? degRad(product.tryOnModelRotationX)
          : autoFitRef.current.rx,
      ry:
        product.tryOnModelRotationY != null &&
        product.tryOnModelRotationY !== ""
          ? degRad(product.tryOnModelRotationY)
          : autoFitRef.current.ry,
      rz:
        product.tryOnModelRotationZ != null &&
        product.tryOnModelRotationZ !== ""
          ? degRad(product.tryOnModelRotationZ)
          : autoFitRef.current.rz,
    }),
    [
      autoFitTick,
      product.tryOnModelOffsetY,
      product.tryOnModelOffsetZ,
      product.tryOnModelRotationX,
      product.tryOnModelRotationY,
      product.tryOnModelRotationZ,
      product.tryOnModelScaleMultiplier,
      product.tryOnType,
    ],
  );

  useEffect(() => {
    setSelectedImage(images[0] || getPrimaryImage(product));
  }, [images, product]);
  useEffect(() => {
    setSelectedColor(colors[0] || "");
  }, [colors, productId]);

  // ── Three.js init: bind directly to <canvas> element ────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lights — bright so glasses render clearly
    scene.add(new THREE.AmbientLight(0xffffff, 2.2));
    const key = new THREE.DirectionalLight(0xfff8f0, 2.0);
    key.position.set(0, 200, 600);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd0e8ff, 0.8);
    fill.position.set(-200, -100, 300);
    scene.add(fill);

    const anchor = new THREE.Group();
    const wrapper = new THREE.Group();
    anchor.add(wrapper);
    anchor.visible = false;
    scene.add(anchor);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    anchorRef.current = anchor;
    wrapperRef.current = wrapper;

    // Sync canvas pixel size to its CSS display size every frame via ResizeObserver
    const syncSize = () => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (w === 0 || h === 0) return;
      containerSizeRef.current = { w, h };
      // setSize(w, h, false) — false means "don't change canvas CSS style"
      renderer.setSize(w, h, false);
      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h / 2;
      camera.bottom = -h / 2;
      camera.updateProjectionMatrix();
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      renderer.dispose();
      sceneRef.current =
        cameraRef.current =
        rendererRef.current =
        anchorRef.current =
        wrapperRef.current =
          null;
    };
  }, []);

  // ── Load GLB ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const anchor = anchorRef.current;
    if (!wrapper || !anchor) return;

    wrapper.clear();
    anchor.visible = false;
    modelRef.current = null;
    smoothRef.current = null;

    if (!product.tryOnAsset) {
      setAssetMsg("3D asset missing. Upload a GLB model from admin panel.");
      return;
    }

    setAssetMsg("Loading 3D model…");
    new GLTFLoader().load(
      product.tryOnAsset,
      (gltf) => {
        const obj = gltf.scene || gltf.scenes?.[0];
        if (!obj || !wrapperRef.current || !anchorRef.current) return;

        obj.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = child.receiveShadow = false;
          child.frustumCulled = false;
          if (child.material) {
            child.material.needsUpdate = true;
          }
        });

        // Step 1: centre pivot at bounding-box centre
        const box0 = new THREE.Box3().setFromObject(obj);
        obj.position.sub(box0.getCenter(new THREE.Vector3()));

        // Step 2: find orientation where X is widest
        const best = findBestOrientation(obj);
        obj.rotation.set(best.rx, best.ry, best.rz);
        obj.updateMatrixWorld(true);

        // Step 3: measure oriented bounding box
        const s1 = new THREE.Vector3();
        new THREE.Box3().setFromObject(obj).getSize(s1);
        const dominantW = Math.max(s1.x, 1e-4);

        // Shift the local pivot closer to the bridge area instead of the box center.
        if (product.tryOnType === "glasses") {
          obj.position.y -= s1.y * 0.1;
        }

        // Step 4: normalise width to 1 unit, but reset the object rotation so
        // the chosen best orientation is applied only once via wrapper rotation.
        obj.rotation.set(0, 0, 0);
        obj.scale.setScalar(1 / dominantW);
        obj.updateMatrixWorld(true);

        // Auto-calibration values
        const yRatio = s1.y / dominantW;
        autoFitRef.current = {
          rx: best.rx,
          ry: best.ry,
          rz: best.rz,
          offsetY:
            product.tryOnType === "glasses"
              ? -clamp(yRatio * 0.12, 0.015, 0.06)
              : 0,
          offsetZ: 0,
          scaleMul:
            product.tryOnType === "glasses"
              ? clamp(1.9 + Math.max(yRatio, 0.18) * 0.45, 1.9, 2.35)
              : 1.5,
        };
        setAutoFitTick((t) => t + 1);

        wrapperRef.current.add(obj);
        modelRef.current = obj;
        anchorRef.current.visible = false;
        setAssetMsg("3D model ready — auto-fit complete.");
        setTrackingMsg("Model loaded. Look at the camera for live fit.");
      },
      undefined,
      (err) => {
        console.error(err);
        setAssetMsg("3D model failed to load. Check asset URL.");
        setTrackingMsg("3D model load error.");
      },
    );
  }, [product.tryOnAsset, product.tryOnType]);

  // ── Camera stream ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setTrackingMsg("Camera live. Align your face inside the frame.");
        }
      } catch {
        setCameraError("Camera access failed. Please allow camera permission.");
        setTrackingMsg("Camera access required for virtual try-on.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      rafRef.current && cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── Face tracking + render loop ───────────────────────────────────────────────
  useEffect(() => {
    if (!cameraReady) return;
    let cancelled = false;

    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
        );
        if (cancelled) return;
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: true,
        });
        setTrackingMsg("AI face tracking ready. Look straight at the camera.");
      } catch {
        setTrackingMsg("AI tracking load failed. Use fit controls.");
      }
    })();

    const loop = () => {
      const video = videoRef.current;
      const lmk = landmarkerRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const anchor = anchorRef.current;
      const wrapper = wrapperRef.current;
      const model = modelRef.current;

      if (
        lmk &&
        video &&
        anchor &&
        wrapper &&
        model &&
        renderer &&
        camera &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.currentTime !== lastTimeRef.current
      ) {
        lastTimeRef.current = video.currentTime;

        try {
          const result = lmk.detectForVideo(video, performance.now());
          const lms = result.faceLandmarks?.[0];
          const matData = result.facialTransformationMatrixes?.[0]?.data;

          if (lms?.length) {
            const { w: W, h: H } = containerSizeRef.current;

            /*
              COORDINATE MAPPING — this is the most critical part.

              MediaPipe returns normalised coords (0→1) in the raw camera frame.
              x=0 is the LEFT edge of the raw frame (from camera's perspective).

              Our <video> has CSS transform: scaleX(-1) applied.
              This makes it look like a mirror (selfie view).
              So what MediaPipe calls x=0 (camera-left) appears on the RIGHT of the screen.

              Our <canvas> has NO CSS transform — it is NOT flipped.
              We draw the 3D model here.

              So to place the model at the same position as a face feature on screen:
                screenX = (1 - lm.x) maps raw coords to mirrored screen 0→1
                Then centre: screenX_centred = (screenX - 0.5) * W
                            = (0.5 - lm.x) * W    ← simplified

              Y in MediaPipe: 0 = top, 1 = bottom
              Y in Three.js orthographic: positive = UP (opposite of screen)
              So: threeY = (0.5 - lm.y) * H
            */
            const lp = (lm) => ({
              x: (0.5 - lm.x) * W,
              y: (0.5 - lm.y) * H,
              z: lm.z || 0,
            });

            // Standard Face Landmarker points for glasses fitting
            const lTemple = lp(lms[127]);
            const rTemple = lp(lms[356]);
            const lOuter = lp(lms[33]);
            const rOuter = lp(lms[263]);
            const lInner = lp(lms[133]);
            const rInner = lp(lms[362]);
            const lEyeTop = lp(lms[159] || lms[33]);
            const lEyeBot = lp(lms[145] || lms[133]);
            const rEyeTop = lp(lms[386] || lms[263]);
            const rEyeBot = lp(lms[374] || lms[362]);
            const lBrow = lp(lms[70] || lms[105] || lms[33]);
            const rBrow = lp(lms[300] || lms[334] || lms[263]);
            const bridge = lp(lms[168]);
            const noseTip = lp(lms[1]);

            // Derived
            const lEyeC = {
              x: (lOuter.x + lInner.x) * 0.5,
              y: (lOuter.y + lInner.y) * 0.5,
            };
            const rEyeC = {
              x: (rOuter.x + rInner.x) * 0.5,
              y: (rOuter.y + rInner.y) * 0.5,
            };
            const eyesC = {
              x: (lEyeC.x + rEyeC.x) * 0.5,
              y: (lEyeC.y + rEyeC.y) * 0.5,
            };
            const browC = {
              x: (lBrow.x + rBrow.x) * 0.5,
              y: (lBrow.y + rBrow.y) * 0.5,
            };

            const templeSpan = Math.hypot(
              rTemple.x - lTemple.x,
              rTemple.y - lTemple.y,
            );
            const eyeSpan = Math.hypot(
              rOuter.x - lOuter.x,
              rOuter.y - lOuter.y,
            );
            const innerSpan = Math.hypot(
              rInner.x - lInner.x,
              rInner.y - lInner.y,
            );
            const lEyeH = Math.hypot(
              lEyeTop.x - lEyeBot.x,
              lEyeTop.y - lEyeBot.y,
            );
            const rEyeH = Math.hypot(
              rEyeTop.x - rEyeBot.x,
              rEyeTop.y - rEyeBot.y,
            );
            const avgEyeH = (lEyeH + rEyeH) * 0.5;
            const browToEye = Math.abs(eyesC.y - browC.y);
            const eyeToBridge = Math.abs(bridge.y - eyesC.y);

            const faceWidth = templeSpan * 1.02;
            const anchorX = lerp(eyesC.x, bridge.x, 0.18);
            const anchorY = lerp(eyesC.y, bridge.y, 0.45);

            // Rotation from MediaPipe 4×4 world matrix
            let yaw = 0,
              pitch = 0,
              roll = 0;
            if (matData?.length === 16) {
              const mat = new THREE.Matrix4().fromArray(matData);
              const q = new THREE.Quaternion();
              mat.decompose(new THREE.Vector3(), q, new THREE.Vector3());
              const euler = new THREE.Euler().setFromQuaternion(q, "YXZ");
              yaw = clamp(-euler.y, -1.1, 1.1);
              pitch = clamp(euler.x, -0.8, 0.8);
              roll = clamp(-euler.z, -0.8, 0.8);
            } else {
              yaw = ((lms[127]?.z || 0) - (lms[356]?.z || 0)) * 6.8;
              pitch = ((lms[1]?.z || 0) - (lms[168]?.z || 0)) * 7.2;
              roll = Math.atan2(rOuter.y - lOuter.y, rOuter.x - lOuter.x);
            }

            // Blend in 25% eye-line roll for stability
            const eyeRoll = Math.atan2(
              rOuter.y - lOuter.y,
              rOuter.x - lOuter.x,
            );
            roll = lerp(roll, eyeRoll, 0.15);

            // Scale
            const widthScale = Number(product.tryOnWidthScale || 1.0);
            const heightRatio = Number(product.tryOnHeightRatio || 0.36);
            const yOffsetFactor = Number(product.tryOnYOffset || -0.015);
            const yawComp = 1 + Math.min(Math.abs(yaw), 0.75) * 0.08;
            const effectiveScaleMul =
              product.tryOnType === "glasses"
                ? clamp(modelCal.scaleMul, 1.8, 2.35)
                : modelCal.scaleMul;

            const targetW = Math.max(
              faceWidth * widthScale * yawComp,
              innerSpan * 1.95,
              eyeSpan * 1.38,
            );
            const targetH = Math.max(
              targetW * heightRatio,
              browToEye * 1.7,
              avgEyeH * 3.8,
            );
            const finalY =
              anchorY +
              targetH * yOffsetFactor +
              lerp(0, eyeToBridge - targetH * 0.08, 0.18);
            const targetScale =
              targetW * effectiveScaleMul * adjustments.scale * 0.78;

            // Smoothing
            const tgt = {
              x: anchorX + adjustments.offsetX,
              y: finalY + adjustments.offsetY,
              sc: targetScale,
              rz: roll + degRad(adjustments.tilt),
              ry: clamp(yaw * 0.3, -0.24, 0.24),
              rx: clamp(pitch * 0.14, -0.1, 0.1),
            };
            const prev = smoothRef.current || { ...tgt };
            const next = {
              x: lerp(prev.x, tgt.x, 0.52),
              y: lerp(prev.y, tgt.y, 0.52),
              sc: lerp(prev.sc, tgt.sc, 0.42),
              rz: lerp(prev.rz, tgt.rz, 0.35),
              ry: lerp(prev.ry, tgt.ry, 0.28),
              rx: lerp(prev.rx, tgt.rx, 0.28),
            };
            smoothRef.current = next;

            // Apply to Three.js scene
            anchor.visible = true;
            anchor.position.set(next.x, next.y, 0);
            anchor.rotation.set(0, 0, next.rz);
            wrapper.position.set(
              0,
              next.sc * modelCal.offsetY,
              next.sc * modelCal.offsetZ,
            );
            wrapper.rotation.set(
              modelCal.rx + next.rx,
              modelCal.ry + next.ry,
              modelCal.rz,
            );
            wrapper.scale.setScalar(next.sc);

            setTrackingMsg("Face detected ✓ — glasses are tracking your face.");
          } else {
            anchor.visible = false;
            setTrackingMsg("Face not detected. Look at camera in good light.");
          }
        } catch (e) {
          anchor.visible = false;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      rafRef.current && cancelAnimationFrame(rafRef.current);
    };
  }, [
    cameraReady,
    adjustments,
    modelCal,
    product.tryOnWidthScale,
    product.tryOnYOffset,
    product.tryOnHeightRatio,
  ]);

  const overlayImage =
    product.tryOnOverlayImage || selectedImage || getPrimaryImage(product);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#03040d_0%,#09061b_100%)] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="rounded-full border border-white/15 px-5 py-2 text-sm hover:bg-white/10"
          >
            Product Details
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
          >
            Dashboard
          </button>
        </div>

        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_100px_rgba(5,8,20,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">
                3D Virtual Try-On
              </p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
                Live camera with real-time 3D face tracking. Keep your face
                centred and well-lit.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
              {trackingMsg}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          {/* Camera section */}
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div
              className="relative mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-[#060b16]"
              style={{ aspectRatio: "4/5", maxWidth: 760 }}
            >
              {/*
                VIDEO — CSS mirrored (natural selfie view for the user)
              */}
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                style={{ transform: "scaleX(-1)" }}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/*
                CANVAS — NOT mirrored.
                Three.js renders here. Coordinates are mirror-compensated in JS:
                  x = (0.5 - lm.x) * W
                This makes the 3D model land exactly on the mirrored face position.
              */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ display: "block" }}
              />

              <div className="pointer-events-none absolute inset-x-[18%] top-[4%] rounded-full border border-cyan-300/25 px-3 py-2 text-center text-xs text-cyan-100 backdrop-blur-sm">
                Keep face centred · Look straight at the camera
              </div>

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 px-6 text-center text-sm text-rose-100">
                  {cameraError}
                </div>
              )}
            </div>
          </section>

          {/* Controls section */}
          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Try-On Assets</h2>

              {overlayImage && (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1024]">
                  <img
                    src={overlayImage}
                    alt={product.name}
                    className="h-52 w-full object-contain"
                  />
                </div>
              )}

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((img) => (
                    <button
                      key={img}
                      onClick={() => setSelectedImage(img)}
                      className={`overflow-hidden rounded-2xl border ${selectedImage === img ? "border-cyan-400" : "border-white/10"}`}
                    >
                      <img
                        src={img}
                        alt={product.name}
                        className="h-16 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {colors.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-300">
                    Color Variants
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(c)}
                        className={`rounded-full px-4 py-2 text-sm ${selectedColor === c ? "bg-cyan-400 text-slate-950" : "border border-white/15 text-slate-200"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                <p>Try-on enabled: {product.tryOnEnabled ? "Yes" : "No"}</p>
                <p className="mt-1">Type: {product.tryOnType || "Not set"}</p>
                <p className="mt-1">{assetMsg}</p>
                <p className="mt-1 break-all">
                  Overlay: {product.tryOnOverlayImage || "Not added yet"}
                </p>
                <p className="mt-1 break-all">
                  3D asset: {product.tryOnAsset || "Not added yet"}
                </p>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0d1024] p-4">
                <p className="text-sm font-medium text-slate-200">
                  3D Model Preview
                </p>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-[#060b16]">
                  {product.tryOnAsset ? (
                    <model-viewer
                      src={product.tryOnAsset}
                      camera-controls
                      disable-pan
                      disable-zoom
                      shadow-intensity="0.2"
                      style={{
                        width: "100%",
                        height: "260px",
                        background: "transparent",
                      }}
                    />
                  ) : (
                    <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                      Upload a 3D sunglasses model to preview it here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Fit Controls</h2>
              <p className="mt-2 text-sm text-slate-300">
                Fine-tune if auto-fit needs a small tweak.
              </p>
              <div className="mt-5 space-y-4">
                {[
                  {
                    label: "Horizontal Offset",
                    key: "offsetX",
                    min: -120,
                    max: 120,
                    step: 1,
                  },
                  {
                    label: "Vertical Offset",
                    key: "offsetY",
                    min: -120,
                    max: 120,
                    step: 1,
                  },
                  {
                    label: "Scale",
                    key: "scale",
                    min: 0.6,
                    max: 1.8,
                    step: 0.05,
                  },
                  { label: "Tilt", key: "tilt", min: -20, max: 20, step: 1 },
                ].map(({ label, key, min, max, step }) => (
                  <label key={key} className="block text-sm text-slate-300">
                    {label}
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={adjustments[key]}
                      onChange={(e) =>
                        setAdjustments((p) => ({
                          ...p,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="mt-2 w-full"
                    />
                  </label>
                ))}
                <button
                  onClick={() =>
                    setAdjustments({
                      offsetX: 0,
                      offsetY: 0,
                      scale: 1,
                      tilt: 0,
                    })
                  }
                  className="mt-2 w-full rounded-2xl border border-white/15 py-2 text-sm text-slate-300 hover:bg-white/10"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
