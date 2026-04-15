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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp = (a, b, t) => a + (b - a) * t;
const degRad = (d) => (Number(d || 0) * Math.PI) / 180;

// ─── Find best orientation (widest on X) ─────────────────────────────────────
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
        const W = Math.max(s.x, 1e-4), H = Math.max(s.y, 1e-4), D = Math.max(s.z, 1e-4);
        const score = (W / H) * 2.4 + W / D - D * 0.18;
        if (score > best.score) best = { rx, ry, rz, score };
      }
    }
  }
  object.rotation.copy(saved);
  object.updateMatrixWorld(true);
  return best;
};

// ─── EMA smoother class ───────────────────────────────────────────────────────
class EMA {
  constructor(alpha) { this.alpha = alpha; this.v = null; }
  update(val) {
    this.v = this.v === null ? val : lerp(this.v, val, this.alpha);
    return this.v;
  }
  reset() { this.v = null; }
}

// ─── Component ────────────────────────────────────────────────────────────────
const VirtualTryOn = () => {
  const navigate = useNavigate();
  const { productId } = useParams();

  // refs
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const streamRef      = useRef(null);
  const rafRef         = useRef(null);
  const landmarkerRef  = useRef(null);
  const rendererRef    = useRef(null);
  const sceneRef       = useRef(null);
  const cameraRef      = useRef(null);
  const anchorRef      = useRef(null);   // world-space group: position + roll
  const pivotRef       = useRef(null);   // child: yaw/pitch rotation
  const wrapperRef     = useRef(null);   // child: model sits here
  const modelRef       = useRef(null);
  const autoFitRef     = useRef({ rx:0, ry:0, rz:0, offsetY:0, scaleMul:1.6 });
  const lastTimeRef    = useRef(-1);
  const lostRef        = useRef(0);
  const containerRef   = useRef({ w:0, h:0 });
  const modelNormW     = useRef(1);  // stores dominant width for scale mapping

  // per-channel smoothers (fast alpha for responsive feel)
  const smX   = useRef(new EMA(0.50));
  const smY   = useRef(new EMA(0.50));
  const smSc  = useRef(new EMA(0.38));
  const smRoll= useRef(new EMA(0.30));
  const smYaw = useRef(new EMA(0.25));
  const smPitch=useRef(new EMA(0.25));

  // state
  const [products, setProducts]     = useState(fallbackProducts);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [trackingMsg, setTrackingMsg] = useState("Preparing camera…");
  const [assetMsg, setAssetMsg]       = useState("Loading 3D asset…");
  const [autoFitTick, setAutoFitTick] = useState(0);
  const [modelCal, setModelCal]       = useState({ scaleMul:1.6, offsetY:0, rx:0, ry:0, rz:0 });
  const [adjustments, setAdjustments] = useState({ offsetX:0, offsetY:0, scale:1, tilt:0 });
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  // load products
  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length) setProducts(data);
      } catch {}
    })();
  }, []);

  const product = useMemo(
    () => products.find((p) => p._id === productId) || fallbackProducts[0],
    [productId, products]
  );
  const images = useMemo(() => getProductImages(product), [product]);
  const colors = useMemo(() => getProductColors(product), [product]);

  // sync modelCal from product fields + autoFit
  useEffect(() => {
    const af = autoFitRef.current;
    setModelCal({
      scaleMul : product.tryOnModelScaleMultiplier != null && product.tryOnModelScaleMultiplier !== ""
        ? Number(product.tryOnModelScaleMultiplier) : af.scaleMul,
      offsetY  : product.tryOnModelOffsetY != null && product.tryOnModelOffsetY !== ""
        ? Number(product.tryOnModelOffsetY)  : af.offsetY,
      rx : product.tryOnModelRotationX != null && product.tryOnModelRotationX !== ""
        ? degRad(product.tryOnModelRotationX) : af.rx,
      ry : product.tryOnModelRotationY != null && product.tryOnModelRotationY !== ""
        ? degRad(product.tryOnModelRotationY) : af.ry,
      rz : product.tryOnModelRotationZ != null && product.tryOnModelRotationZ !== ""
        ? degRad(product.tryOnModelRotationZ) : af.rz,
    });
  }, [
    autoFitTick,
    product.tryOnModelOffsetY,
    product.tryOnModelRotationX,
    product.tryOnModelRotationY,
    product.tryOnModelRotationZ,
    product.tryOnModelScaleMultiplier,
  ]);

  useEffect(() => { setSelectedImage(images[0] || getPrimaryImage(product)); }, [images, product]);
  useEffect(() => { setSelectedColor(colors[0] || ""); }, [colors, productId]);

  // ── Three.js init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene    = new THREE.Scene();
    const camera   = new THREE.OrthographicCamera(-1,1,1,-1, 0.1, 8000);
    camera.position.z = 2000;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting — bright + natural
    scene.add(new THREE.AmbientLight(0xffffff, 2.8));
    const key = new THREE.DirectionalLight(0xfffaf0, 2.2);
    key.position.set(0, 300, 800);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d8ff, 1.0);
    fill.position.set(-300, -100, 400);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffcc88, 0.7);
    rim.position.set(400, 100, -600);
    scene.add(rim);

    // Hierarchy: anchor (pos+roll) → pivot (yaw+pitch) → wrapper (model offset) → model
    const anchor  = new THREE.Group();
    const pivot   = new THREE.Group();
    const wrapper = new THREE.Group();
    anchor.add(pivot);
    pivot.add(wrapper);
    anchor.visible = false;
    scene.add(anchor);

    sceneRef.current   = scene;
    cameraRef.current  = camera;
    rendererRef.current= renderer;
    anchorRef.current  = anchor;
    pivotRef.current   = pivot;
    wrapperRef.current = wrapper;

    const syncSize = () => {
      const el = canvasRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width), h = Math.round(r.height);
      if (!w || !h) return;
      containerRef.current = { w, h };
      renderer.setSize(w, h, false);
      camera.left   = -w / 2; camera.right = w / 2;
      camera.top    =  h / 2; camera.bottom= -h / 2;
      camera.updateProjectionMatrix();
    };
    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(canvas);

    return () => {
      ro.disconnect();
      renderer.dispose();
      sceneRef.current = cameraRef.current = rendererRef.current =
      anchorRef.current = pivotRef.current = wrapperRef.current = null;
    };
  }, []);

  // ── Load GLB ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const anchor  = anchorRef.current;
    if (!wrapper || !anchor) return;

    wrapper.clear();
    anchor.visible = false;
    modelRef.current = null;
    [smX, smY, smSc, smRoll, smYaw, smPitch].forEach(r => r.current.reset());

    if (!product.tryOnAsset) {
      setAssetMsg("3D asset missing. Upload a GLB from admin panel.");
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
          if (child.material) child.material.needsUpdate = true;
        });

        // 1. centre pivot at bounding-box centre
        const box = new THREE.Box3().setFromObject(obj);
        const ctr = new THREE.Vector3();
        box.getCenter(ctr);
        obj.position.sub(ctr);

        // 2. best orientation
        const best = findBestOrientation(obj);
        obj.rotation.set(best.rx, best.ry, best.rz);
        obj.updateMatrixWorld(true);

        // 3. measure after orientation
        const sz = new THREE.Vector3();
        new THREE.Box3().setFromObject(obj).getSize(sz);
        const domW = Math.max(sz.x, 1e-4);
        modelNormW.current = domW;

        // 4. NORMALIZE width → 1 unit in 3D space
        // In ortho camera, 1 world unit = 1 pixel, so wrapper.scale = pixels directly
        obj.scale.setScalar(1 / domW);
        obj.updateMatrixWorld(true);

        // For glasses: shift pivot up to bridge area
        if (product.tryOnType === "glasses") {
          obj.position.y += sz.y / domW * 0.05; // small lift toward bridge
        }

        // auto-calibration
        const yRatio = sz.y / domW;
        autoFitRef.current = {
          rx: best.rx,
          ry: best.ry,
          rz: best.rz,
          offsetY: product.tryOnType === "glasses"
            ? clamp(yRatio * 0.04, 0.01, 0.035)
            : 0,
          scaleMul: product.tryOnType === "glasses"
            ? clamp(1.55 + yRatio * 0.18, 1.55, 1.85)
            : 1.5,
        };
        setAutoFitTick(t => t + 1);

        wrapperRef.current.add(obj);
        modelRef.current = obj;
        anchorRef.current.visible = false;
        setAssetMsg("✓ 3D model ready");
        setTrackingMsg("Model loaded. Look at the camera!");
      },
      undefined,
      (err) => {
        console.error(err);
        setAssetMsg("3D model failed to load. Check asset URL.");
      }
    );
  }, [product.tryOnAsset, product.tryOnType]);

  // ── Camera stream ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode:"user", width:{ideal:1280}, height:{ideal:720} },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setTrackingMsg("Camera live. Align your face in the frame.");
        }
      } catch {
        setCameraError("Camera access failed. Please allow camera permission.");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
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
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
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
        setTrackingMsg("AI face tracking ready ✓");
      } catch {
        setTrackingMsg("AI tracking load failed. Use fit controls.");
      }
    })();

    const loop = () => {
      if (cancelled) return;

      const video   = videoRef.current;
      const lmk     = landmarkerRef.current;
      const renderer= rendererRef.current;
      const camera  = cameraRef.current;
      const anchor  = anchorRef.current;
      const pivot   = pivotRef.current;
      const wrapper = wrapperRef.current;
      const model   = modelRef.current;

      const canDetect =
        lmk && video && anchor && pivot && wrapper && model && renderer && camera &&
        video.readyState >= 2 && video.videoWidth > 0 &&
        video.currentTime !== lastTimeRef.current;

      if (canDetect) {
        lastTimeRef.current = video.currentTime;

        try {
          const result  = lmk.detectForVideo(video, performance.now());
          const lms     = result.faceLandmarks?.[0];
          const matData = result.facialTransformationMatrixes?.[0]?.data;

          if (lms?.length) {
            const { w:W, h:H } = containerRef.current;
            if (!W || !H) { rafRef.current = requestAnimationFrame(loop); return; }

            // ── Mirror compensation ──────────────────────────────────────────
            // Video has CSS scaleX(-1), canvas does NOT.
            // So: canvasX = (1 - lm.x) mapped to [-W/2, W/2]
            //             = (0.5 - lm.x) * W
            // canvasY: (0.5 - lm.y) * H  (Three.js Y is up)
            const mp = (lm) => ({
              x: (0.5 - lm.x) * W,
              y: (0.5 - lm.y) * H,
            });

            // Key landmarks
            const L_TEMPLE  = mp(lms[127]);
            const R_TEMPLE  = mp(lms[356]);
            const L_EYE_OUT = mp(lms[33]);
            const R_EYE_OUT = mp(lms[263]);
            const L_EYE_IN  = mp(lms[133]);
            const R_EYE_IN  = mp(lms[362]);
            const L_EYE_TOP = mp(lms[159]);
            const L_EYE_BOT = mp(lms[145]);
            const R_EYE_TOP = mp(lms[386]);
            const R_EYE_BOT = mp(lms[374]);
            const BRIDGE    = mp(lms[168]); // nose bridge top
            const NOSE_TIP  = mp(lms[1]);
            const L_BROW    = mp(lms[105]);
            const R_BROW    = mp(lms[334]);

            // ── Derived measurements ─────────────────────────────────────────
            const lEyeCX = (L_EYE_OUT.x + L_EYE_IN.x) * 0.5;
            const lEyeCY = (L_EYE_OUT.y + L_EYE_IN.y) * 0.5;
            const rEyeCX = (R_EYE_OUT.x + R_EYE_IN.x) * 0.5;
            const rEyeCY = (R_EYE_OUT.y + R_EYE_IN.y) * 0.5;
            const eyesCX = (lEyeCX + rEyeCX) * 0.5;
            const eyesCY = (lEyeCY + rEyeCY) * 0.5;

            // Eye-to-eye distance (pixel space) — primary scale driver
            const eyeSpanX = R_EYE_OUT.x - L_EYE_OUT.x;
            const eyeSpanY = R_EYE_OUT.y - L_EYE_OUT.y;
            const eyeSpan  = Math.hypot(eyeSpanX, eyeSpanY);

            const templeSpan = Math.hypot(
              R_TEMPLE.x - L_TEMPLE.x, R_TEMPLE.y - L_TEMPLE.y
            );
            const lEyeH = Math.hypot(L_EYE_TOP.x-L_EYE_BOT.x, L_EYE_TOP.y-L_EYE_BOT.y);
            const rEyeH = Math.hypot(R_EYE_TOP.x-R_EYE_BOT.x, R_EYE_TOP.y-R_EYE_BOT.y);

            // ── Rotation from MediaPipe 4×4 world matrix ─────────────────────
            let yaw = 0, pitch = 0, roll = 0;
            if (matData?.length === 16) {
              const mat = new THREE.Matrix4().fromArray(matData);
              const q   = new THREE.Quaternion();
              const sc  = new THREE.Vector3();
              mat.decompose(new THREE.Vector3(), q, sc);
              const euler = new THREE.Euler().setFromQuaternion(q, "YXZ");
              // MediaPipe X axis is flipped relative to mirror view
              yaw   = clamp( euler.y, -1.2, 1.2);   // left-right head turn
              pitch = clamp( euler.x, -0.9, 0.9);   // up-down
              roll  = clamp(-euler.z, -0.9, 0.9);   // tilt
            } else {
              // Fallback: estimate from depth landmarks
              yaw   = ((lms[127]?.z || 0) - (lms[356]?.z || 0)) * 7;
              pitch = ((lms[1]?.z  || 0) - (lms[168]?.z || 0)) * 7;
              roll  = Math.atan2(eyeSpanY, eyeSpanX);
            }

            // Blend roll with geometric eye-line for stability
            const geoRoll = Math.atan2(eyeSpanY, eyeSpanX);
            roll = roll * 0.75 + geoRoll * 0.25;

            // ── ANCHOR POSITION ───────────────────────────────────────────────
            // Snapchat style: anchor = midpoint of eyes, then nudge toward bridge
            // This is what keeps glasses ON the face, not floating above it.
            const anchorX = eyesCX * 0.70 + BRIDGE.x * 0.30;
            const anchorY = eyesCY * 0.70 + BRIDGE.y * 0.30;

            // ── SCALE (pixels, direct ortho mapping) ──────────────────────────
            // Model is normalized to width=1 unit.
            // Ortho camera: 1 world unit = 1 CSS pixel.
            // We want glasses to be ~templeSpan wide.
            const effectiveScaleMul = clamp(modelCal.scaleMul, 1.4, 2.0);
            const widthPx = Math.max(
              templeSpan * 0.96,
              eyeSpan    * 1.32,
            ) * effectiveScaleMul * (Number(product.tryOnWidthScale) || 1.0) * adjustments.scale;

            const targetScale = clamp(widthPx, 80, Math.min(W, H) * 0.80);

            // ── SMOOTH ───────────────────────────────────────────────────────
            const sx    = smX.current.update(anchorX + adjustments.offsetX);
            const sy    = smY.current.update(anchorY + adjustments.offsetY);
            const sc    = smSc.current.update(targetScale);
            const sRoll = smRoll.current.update(roll + degRad(adjustments.tilt));
            const sYaw  = smYaw.current.update(yaw);
            const sPitch= smPitch.current.update(pitch);

            lostRef.current = 0;

            // ── APPLY TO SCENE ────────────────────────────────────────────────
            anchor.visible = true;

            // anchor: screen position + roll
            anchor.position.set(sx, sy, 0);
            anchor.rotation.set(0, 0, sRoll);

            // pivot: head rotation (yaw & pitch) — 3D effect
            pivot.rotation.set(
              modelCal.rx + sPitch * 0.22,
              modelCal.ry + sYaw  * 0.38,
              modelCal.rz
            );

            // wrapper: model offset (bridge alignment) + uniform scale
            // offsetY pushes model up so the nose-pad sits on the bridge
            wrapper.position.set(0, sc * modelCal.offsetY, 0);
            wrapper.scale.setScalar(sc);

            setTrackingMsg("Face detected ✓");
          } else {
            lostRef.current += 1;
            if (lostRef.current > 6) {
              anchor.visible = false;
              [smX,smY,smSc,smRoll,smYaw,smPitch].forEach(r => r.current.reset());
              setTrackingMsg("No face detected. Look at camera in good light.");
            }
          }
        } catch {
          lostRef.current += 1;
          if (lostRef.current > 6) { anchor.visible = false; }
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
  }, [cameraReady, adjustments, modelCal,
      product.tryOnWidthScale, product.tryOnType]);

  const overlayImage = product.tryOnOverlayImage || selectedImage || getPrimaryImage(product);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#03040d_0%,#09061b_100%)] px-4 py-6 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Nav */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            className="rounded-full border border-white/15 px-5 py-2 text-sm hover:bg-white/10"
          >
            ← Product Details
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-5 py-2 text-sm text-cyan-100 hover:bg-cyan-400/20"
          >
            Dashboard
          </button>
        </div>

        {/* Header */}
        <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 shadow-[0_24px_100px_rgba(5,8,20,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/75">3D Virtual Try-On</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
                Live camera with real-time 3D face tracking. Keep your face centred and well-lit.
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
              {trackingMsg}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

          {/* ── Camera + Canvas ─────────────────────────────────────────────── */}
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div
              className="relative mx-auto overflow-hidden rounded-[28px] border border-white/10 bg-[#060b16]"
              style={{ aspectRatio:"4/5", maxWidth:760 }}
            >
              {/*
                VIDEO: CSS mirrored — natural selfie view for user.
              */}
              <video
                ref={videoRef}
                muted playsInline autoPlay
                style={{ transform:"scaleX(-1)" }}
                className="absolute inset-0 h-full w-full object-cover"
              />

              {/*
                CANVAS: NOT mirrored.
                All landmark coords are mirror-compensated in JS:
                  canvasX = (0.5 - lm.x) * W
                This places the 3D model exactly over the mirrored face.
              */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full pointer-events-none"
                style={{ display:"block" }}
              />

              {/* Guide overlay */}
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

          {/* ── Controls ────────────────────────────────────────────────────── */}
          <section className="space-y-6">

            {/* Asset info */}
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Try-On Assets</h2>

              {overlayImage && (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1024]">
                  <img src={overlayImage} alt={product.name} className="h-52 w-full object-contain" />
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
                      <img src={img} alt={product.name} className="h-16 w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {colors.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-300">Color Variants</p>
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
                <p className="mt-1 break-all">Overlay: {product.tryOnOverlayImage || "Not added yet"}</p>
                <p className="mt-1 break-all">3D asset: {product.tryOnAsset || "Not added yet"}</p>
              </div>

              {/* Model preview */}
              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0d1024] p-4">
                <p className="text-sm font-medium text-slate-200">3D Model Preview</p>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-[#060b16]">
                  {product.tryOnAsset ? (
                    <div className="flex h-[260px] flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-300">
                      <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-cyan-100">
                        Live try-on active above ↑
                      </div>
                      <p>Preview panel disabled to prevent duplicate Three.js instance.</p>
                      <a
                        href={product.tryOnAsset}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/15 px-4 py-2 text-white hover:bg-white/10"
                      >
                        Open GLB ↗
                      </a>
                    </div>
                  ) : (
                    <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
                      Upload a 3D model to see it here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fit controls */}
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Fit Controls</h2>
              <p className="mt-2 text-sm text-slate-300">Fine-tune if auto-fit needs a small tweak.</p>
              <div className="mt-5 space-y-4">
                {[
                  { label:"Horizontal Offset", key:"offsetX", min:-120, max:120, step:1 },
                  { label:"Vertical Offset",   key:"offsetY", min:-120, max:120, step:1 },
                  { label:"Scale",             key:"scale",   min:0.6,  max:1.8, step:0.05 },
                  { label:"Tilt",              key:"tilt",    min:-20,  max:20,  step:1 },
                ].map(({ label, key, min, max, step }) => (
                  <label key={key} className="block text-sm text-slate-300">
                    <span className="flex justify-between">
                      <span>{label}</span>
                      <span className="text-cyan-300">{adjustments[key]}</span>
                    </span>
                    <input
                      type="range" min={min} max={max} step={step}
                      value={adjustments[key]}
                      onChange={(e) =>
                        setAdjustments(p => ({ ...p, [key]: Number(e.target.value) }))
                      }
                      className="mt-2 w-full accent-cyan-400"
                    />
                  </label>
                ))}
                <button
                  onClick={() => setAdjustments({ offsetX:0, offsetY:0, scale:1, tilt:0 })}
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