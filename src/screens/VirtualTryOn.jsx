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

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;
const degToRad = (value) => (Number(value || 0) * Math.PI) / 180;
const toStagePoint = (landmark, width, height) => ({
  x: (0.5 - landmark.x) * width,
  y: (0.5 - landmark.y) * height,
  z: landmark.z || 0,
});

const findBestGlassesOrientation = (object) => {
  const angles = [0, Math.PI / 2, -Math.PI / 2, Math.PI];
  const originalRotation = object.rotation.clone();
  let best = {
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    score: -Infinity,
    size: { x: 1, y: 0.35, z: 0.2 },
  };

  for (const rotationX of [0, Math.PI / 2, -Math.PI / 2]) {
    for (const rotationY of angles) {
      for (const rotationZ of angles) {
        object.rotation.set(rotationX, rotationY, rotationZ);
        object.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);

        const width = Math.max(size.x, 0.0001);
        const height = Math.max(size.y, 0.0001);
        const depth = Math.max(size.z, 0.0001);
        const widthHeightRatio = width / height;
        const flatness = width / depth;
        const score = widthHeightRatio * 2.4 + flatness - depth * 0.18;

        if (score > best.score) {
          best = {
            rotationX,
            rotationY,
            rotationZ,
            score,
            size: { x: width, y: height, z: depth },
          };
        }
      }
    }
  }

  object.rotation.copy(originalRotation);
  object.updateMatrixWorld(true);
  return best;
};

const VirtualTryOn = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const frameRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rendererMountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const anchorGroupRef = useRef(null);
  const modelWrapperRef = useRef(null);
  const modelObjectRef = useRef(null);
  const modelSizeRef = useRef({ x: 1, y: 0.35, z: 0.2 });
  const autoModelFitRef = useRef({
    rotationX: 0,
    rotationY: 0,
    rotationZ: 0,
    offsetY: -0.04,
    offsetZ: 0,
    scaleMultiplier: 1.7,
  });
  const lastVideoTimeRef = useRef(-1);
  const smoothedStateRef = useRef(null);

  const [products, setProducts] = useState(fallbackProducts);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [trackingMessage, setTrackingMessage] = useState("Preparing camera...");
  const [assetMessage, setAssetMessage] = useState("Loading 3D asset...");
  const [autoFitTick, setAutoFitTick] = useState(0);
  const [adjustments, setAdjustments] = useState({
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    tilt: 0,
  });
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedImage, setSelectedImage] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch(`${API_BASE}/products`);
        const data = await res.json();
        if (res.ok && Array.isArray(data) && data.length) {
          setProducts(data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    loadProducts();
  }, []);

  const product = useMemo(
    () => products.find((item) => item._id === productId) || fallbackProducts[0],
    [productId, products]
  );
  const images = useMemo(() => getProductImages(product), [product]);
  const colors = useMemo(() => getProductColors(product), [product]);
  const modelCalibration = useMemo(
    () => ({
      scaleMultiplier:
        product.tryOnModelScaleMultiplier === undefined ||
        product.tryOnModelScaleMultiplier === null ||
        product.tryOnModelScaleMultiplier === ""
          ? autoModelFitRef.current.scaleMultiplier
          : Number(product.tryOnModelScaleMultiplier),
      offsetY:
        product.tryOnModelOffsetY === undefined ||
        product.tryOnModelOffsetY === null ||
        product.tryOnModelOffsetY === ""
          ? autoModelFitRef.current.offsetY
          : Number(product.tryOnModelOffsetY),
      offsetZ:
        product.tryOnModelOffsetZ === undefined ||
        product.tryOnModelOffsetZ === null ||
        product.tryOnModelOffsetZ === ""
          ? autoModelFitRef.current.offsetZ
          : Number(product.tryOnModelOffsetZ),
      rotationX:
        product.tryOnModelRotationX === undefined ||
        product.tryOnModelRotationX === null ||
        product.tryOnModelRotationX === ""
          ? autoModelFitRef.current.rotationX
          : degToRad(product.tryOnModelRotationX),
      rotationY:
        product.tryOnModelRotationY === undefined ||
        product.tryOnModelRotationY === null ||
        product.tryOnModelRotationY === ""
          ? autoModelFitRef.current.rotationY
          : degToRad(product.tryOnModelRotationY),
      rotationZ:
        product.tryOnModelRotationZ === undefined ||
        product.tryOnModelRotationZ === null ||
        product.tryOnModelRotationZ === ""
          ? autoModelFitRef.current.rotationZ
          : degToRad(product.tryOnModelRotationZ),
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
    ]
  );

  useEffect(() => {
    setSelectedImage(images[0] || getPrimaryImage(product));
  }, [images, product]);

  useEffect(() => {
    setSelectedColor(colors[0] || "");
  }, [colors, productId]);

  useEffect(() => {
    if (!rendererMountRef.current) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 2000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    rendererMountRef.current.innerHTML = "";
    rendererMountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.6);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
    directionalLight.position.set(0, 0, 400);
    scene.add(ambientLight, directionalLight);

    const anchorGroup = new THREE.Group();
    const modelWrapper = new THREE.Group();
    anchorGroup.add(modelWrapper);
    anchorGroup.visible = false;
    scene.add(anchorGroup);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    anchorGroupRef.current = anchorGroup;
    modelWrapperRef.current = modelWrapper;

    const resize = () => {
      const mount = rendererMountRef.current;
      if (!mount || !rendererRef.current || !cameraRef.current) {
        return;
      }

      const width = mount.clientWidth;
      const height = mount.clientHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.left = -width / 2;
      cameraRef.current.right = width / 2;
      cameraRef.current.top = height / 2;
      cameraRef.current.bottom = -height / 2;
      cameraRef.current.updateProjectionMatrix();
    };

    resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      anchorGroupRef.current = null;
      modelWrapperRef.current = null;
    };
  }, []);

  useEffect(() => {
    const wrapper = modelWrapperRef.current;
    const anchor = anchorGroupRef.current;
    if (!wrapper || !anchor) {
      return;
    }

    wrapper.clear();
    anchor.visible = false;
    modelObjectRef.current = null;
    modelSizeRef.current = { x: 1, y: 0.35, z: 0.2 };
    smoothedStateRef.current = null;

    if (!product.tryOnAsset) {
      setAssetMessage("3D asset missing. Upload a GLB model from admin panel.");
      return;
    }

    setAssetMessage("Loading 3D sunglasses model...");
    const loader = new GLTFLoader();
    loader.load(
      product.tryOnAsset,
      (gltf) => {
        const object = gltf.scene || gltf.scenes?.[0];
        if (!object || !modelWrapperRef.current || !anchorGroupRef.current) {
          return;
        }

        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = false;
          }
        });

        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        object.position.sub(center);

        const bestOrientation = findBestGlassesOrientation(object);
        object.rotation.set(
          bestOrientation.rotationX,
          bestOrientation.rotationY,
          bestOrientation.rotationZ
        );
        object.updateMatrixWorld(true);

        const orientedBox = new THREE.Box3().setFromObject(object);
        const orientedSize = new THREE.Vector3();
        orientedBox.getSize(orientedSize);

        const dominantWidth = Math.max(orientedSize.x, 0.0001);
        const normalizeScale = 1 / dominantWidth;
        object.rotation.set(0, 0, 0);
        object.scale.setScalar(normalizeScale);
        object.updateMatrixWorld(true);
        const autoScaleMultiplier =
          product.tryOnType === "glasses"
            ? clamp(
                2.55 + Math.max(orientedSize.y / dominantWidth, 0.18) * 0.78,
                2.55,
                3.25
              )
            : 1.45;
        const autoOffsetY =
          product.tryOnType === "glasses"
            ? -clamp((orientedSize.y / dominantWidth) * 0.22, 0.05, 0.16)
            : 0;

        autoModelFitRef.current = {
          rotationX: bestOrientation.rotationX,
          rotationY: bestOrientation.rotationY,
          rotationZ: bestOrientation.rotationZ,
          offsetY: autoOffsetY,
          offsetZ: 0,
          scaleMultiplier: autoScaleMultiplier,
        };
        setAutoFitTick((value) => value + 1);

        modelSizeRef.current = {
          x: 1,
          y: (orientedSize.y || 1) * normalizeScale,
          z: (orientedSize.z || 1) * normalizeScale,
        };
        modelWrapperRef.current.add(object);
        modelObjectRef.current = object;
        anchorGroupRef.current.visible = false;
        modelWrapperRef.current.rotation.set(0, 0, 0);
        modelWrapperRef.current.position.set(0, 0, 0);
        modelWrapperRef.current.scale.setScalar(1);
        setAssetMessage("3D model ready. Face tracking will align it automatically.");
        setTrackingMessage("3D model loaded. Look at the camera for live fit.");
      },
      undefined,
      (error) => {
        console.error(error);
        setAssetMessage("3D model could not load. Check the asset URL or file format.");
        setTrackingMessage("3D model could not load. Check the uploaded asset URL.");
      }
    );
  }, [product.tryOnAsset]);

  useEffect(() => {
    let cancelled = false;

    const startCamera = async () => {
      try {
        setCameraError("");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
          setTrackingMessage("Camera live. Align your face inside the frame.");
        }
      } catch (error) {
        console.error(error);
        setCameraError("Camera access failed. Please allow camera permission.");
        setTrackingMessage("Camera access is required for virtual try-on.");
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraReady || !videoRef.current) {
      return;
    }

    let cancelled = false;

    const createLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        if (cancelled) {
          return;
        }

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
        setTrackingMessage("AI face tracking ready. Look straight at the camera.");
      } catch (error) {
        console.error(error);
        setTrackingMessage(
          "AI face tracking could not load. Use the fit controls for manual adjustment."
        );
      }
    };

    createLandmarker();

    const renderFrame = async () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      const renderer = rendererRef.current;
      const camera = cameraRef.current;
      const anchor = anchorGroupRef.current;
      const wrapper = modelWrapperRef.current;

      if (
        landmarker &&
        video &&
        anchor &&
        wrapper &&
        modelObjectRef.current &&
        renderer &&
        camera &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0 &&
        lastVideoTimeRef.current !== video.currentTime
      ) {
        try {
          lastVideoTimeRef.current = video.currentTime;
          const result = landmarker.detectForVideo(video, performance.now());
          const landmarks = result.faceLandmarks?.[0];
          const transform = result.facialTransformationMatrixes?.[0]?.data;

          if (landmarks?.length) {
            const leftTemple = landmarks[127] || landmarks[33];
            const rightTemple = landmarks[356] || landmarks[263];
            const leftEyeOuter = landmarks[33];
            const rightEyeOuter = landmarks[263];
            const leftEyeInner = landmarks[133] || landmarks[173] || landmarks[33];
            const rightEyeInner = landmarks[362] || landmarks[398] || landmarks[263];
            const leftBrow = landmarks[70] || landmarks[105] || landmarks[33];
            const rightBrow = landmarks[300] || landmarks[334] || landmarks[263];
            const noseBridge = landmarks[168] || landmarks[6];
            const noseTip = landmarks[1] || landmarks[4] || landmarks[6];

            const widthPx = renderer.domElement.clientWidth;
            const heightPx = renderer.domElement.clientHeight;

            const leftTemplePoint = toStagePoint(leftTemple, widthPx, heightPx);
            const rightTemplePoint = toStagePoint(rightTemple, widthPx, heightPx);
            const leftEyeOuterPoint = toStagePoint(leftEyeOuter, widthPx, heightPx);
            const rightEyeOuterPoint = toStagePoint(rightEyeOuter, widthPx, heightPx);
            const leftEyeInnerPoint = toStagePoint(leftEyeInner, widthPx, heightPx);
            const rightEyeInnerPoint = toStagePoint(rightEyeInner, widthPx, heightPx);
            const leftBrowPoint = toStagePoint(leftBrow, widthPx, heightPx);
            const rightBrowPoint = toStagePoint(rightBrow, widthPx, heightPx);
            const noseBridgePoint = toStagePoint(noseBridge, widthPx, heightPx);
            const noseTipPoint = toStagePoint(noseTip, widthPx, heightPx);

            const templeSpan = Math.hypot(
              rightTemplePoint.x - leftTemplePoint.x,
              rightTemplePoint.y - leftTemplePoint.y
            );
            const eyeSpan = Math.hypot(
              rightEyeOuterPoint.x - leftEyeOuterPoint.x,
              rightEyeOuterPoint.y - leftEyeOuterPoint.y
            );
            const innerEyeSpan = Math.hypot(
              rightEyeInnerPoint.x - leftEyeInnerPoint.x,
              rightEyeInnerPoint.y - leftEyeInnerPoint.y
            );

            const bridgeCenterX =
              (leftEyeInnerPoint.x + rightEyeInnerPoint.x + noseBridgePoint.x) / 3;
            const bridgeCenterY =
              (leftBrowPoint.y +
                rightBrowPoint.y +
                leftEyeOuterPoint.y +
                rightEyeOuterPoint.y +
                noseBridgePoint.y) /
              5;
            const rotationZ = Math.atan2(
              rightEyeOuterPoint.y - leftEyeOuterPoint.y,
              rightEyeOuterPoint.x - leftEyeOuterPoint.x
            );
            let yaw =
              ((leftTemple.z || 0) - (rightTemple.z || 0)) * 7.5 +
              ((leftEyeOuter.z || 0) - (rightEyeOuter.z || 0)) * 4;
            let pitch =
              ((noseTipPoint.y - bridgeCenterY) / Math.max(eyeSpan, 1)) * 1.35 +
              ((noseTip.z || 0) - (noseBridge.z || 0)) * 8;
            let roll = rotationZ;

            if (transform?.length === 16) {
              const matrix = new THREE.Matrix4().fromArray(transform);
              const position = new THREE.Vector3();
              const quaternion = new THREE.Quaternion();
              const scaleVector = new THREE.Vector3();
              matrix.decompose(position, quaternion, scaleVector);

              const euler = new THREE.Euler().setFromQuaternion(quaternion, "YXZ");
              yaw = lerp(yaw, clamp(-euler.y, -0.85, 0.85), 0.7);
              pitch = lerp(pitch, clamp(euler.x, -0.65, 0.65), 0.7);
              roll = lerp(roll, clamp(-euler.z, -0.65, 0.65), 0.7);
            }

            const widthScale = Number(product.tryOnWidthScale || 1.08);
            const yOffset = Number(product.tryOnYOffset || -0.12);
            const targetWidth = Math.max(
              templeSpan * widthScale,
              innerEyeSpan * 2.25,
              eyeSpan * 1.45
            );
            const centerY = bridgeCenterY + targetWidth * yOffset;
            const targetScale = targetWidth * modelCalibration.scaleMultiplier * adjustments.scale;

            const target = {
              x: bridgeCenterX + adjustments.offsetX,
              y: centerY + adjustments.offsetY,
              scale: targetScale,
              rotationZ: roll + (adjustments.tilt * Math.PI) / 180,
              rotationY: clamp(yaw * 0.24, -0.18, 0.18),
              rotationX: clamp(pitch * 0.18, -0.12, 0.12),
            };

            const previous =
              smoothedStateRef.current || {
                x: target.x,
                y: target.y,
                scale: target.scale,
                rotationZ: target.rotationZ,
                rotationY: target.rotationY,
                rotationX: target.rotationX,
              };

            const next = {
              x: lerp(previous.x, target.x, 0.58),
              y: lerp(previous.y, target.y, 0.58),
              scale: lerp(previous.scale, target.scale, 0.55),
              rotationZ: lerp(previous.rotationZ, target.rotationZ, 0.6),
              rotationY: lerp(previous.rotationY, target.rotationY, 0.42),
              rotationX: lerp(previous.rotationX, target.rotationX, 0.42),
            };

            smoothedStateRef.current = next;

            anchor.visible = true;
            anchor.position.set(next.x, next.y, 0);
            anchor.rotation.set(0, 0, next.rotationZ);
            wrapper.position.set(
              0,
              next.scale * modelCalibration.offsetY,
              next.scale * modelCalibration.offsetZ
            );
            wrapper.rotation.set(
              modelCalibration.rotationX + next.rotationX,
              modelCalibration.rotationY + next.rotationY,
              modelCalibration.rotationZ
            );
            wrapper.scale.setScalar(next.scale);
            setTrackingMessage("Face detected. 3D sunglasses are following your face.");
          } else {
            anchor.visible = false;
            setTrackingMessage("Face not detected. Look at the camera in good light.");
          }
        } catch (error) {
          console.error(error);
          anchor.visible = false;
          setTrackingMessage("Face tracking paused. Manual adjustment may be needed.");
        }
      }

      if (renderer && sceneRef.current && cameraRef.current) {
        renderer.render(sceneRef.current, cameraRef.current);
      }

      frameRef.current = requestAnimationFrame(renderFrame);
    };

    frameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      cancelled = true;
      landmarkerRef.current?.close?.();
      landmarkerRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [cameraReady, adjustments, modelCalibration, product.tryOnWidthScale, product.tryOnYOffset]);

  const selectedOverlayImage = product.tryOnOverlayImage || selectedImage || getPrimaryImage(product);

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
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{product.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">
                Live camera preview with your actual 3D sunglasses model anchored to eye,
                brow, and nose landmarks. For best results, keep your face centered and
                well lit.
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-50">
              {trackingMessage}
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[760px] overflow-hidden rounded-[28px] border border-white/10 bg-[#060b16]">
              <video
                ref={videoRef}
                muted
                playsInline
                autoPlay
                className="h-full w-full scale-x-[-1] object-cover"
              />

              <div
                ref={rendererMountRef}
                className="pointer-events-none absolute inset-0"
              />

              <div className="pointer-events-none absolute inset-0 border-[20px] border-transparent sm:border-[28px]">
                <div className="h-full w-full rounded-[28px] border border-white/10" />
              </div>

              <div className="pointer-events-none absolute inset-x-[18%] top-[16%] rounded-full border border-cyan-300/25 px-3 py-2 text-center text-xs text-cyan-100 backdrop-blur">
                Keep your face centered and look straight at the camera
              </div>

              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 px-6 text-center text-sm text-rose-100">
                  {cameraError}
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Try-On Assets</h2>

              {selectedOverlayImage && (
                <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1024]">
                  <img
                    src={selectedOverlayImage}
                    alt={product.name}
                    className="h-52 w-full object-contain bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_transparent_55%)]"
                  />
                </div>
              )}

              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {images.map((image) => (
                    <button
                      key={image}
                      onClick={() => setSelectedImage(image)}
                      className={`overflow-hidden rounded-2xl border ${
                        selectedImage === image
                          ? "border-cyan-400"
                          : "border-white/10"
                      }`}
                    >
                      <img
                        src={image}
                        alt={product.name}
                        className="h-16 w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {colors.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-slate-300">Color Variants</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`rounded-full px-4 py-2 text-sm ${
                          selectedColor === color
                            ? "bg-cyan-400 text-slate-950"
                            : "border border-white/15 text-slate-200"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
                <p>Try-on enabled: {product.tryOnEnabled ? "Yes" : "No"}</p>
                <p className="mt-1">Try-on type: {product.tryOnType || "Not set"}</p>
                <p className="mt-1">{assetMessage}</p>
                <p className="mt-1 break-all">
                  Overlay image: {product.tryOnOverlayImage || "Not added yet"}
                </p>
                <p className="mt-1 break-all">
                  3D asset: {product.tryOnAsset || "Not added yet"}
                </p>
                <p className="mt-1">
                  3D fit: scale {product.tryOnModelScaleMultiplier ?? 1.45}, rotate Y{" "}
                  {product.tryOnModelRotationY ?? 90}°
                </p>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/10 bg-[#0d1024] p-4">
                <p className="text-sm font-medium text-slate-200">3D Model Preview</p>
                <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10 bg-[#060b16]">
                  {product.tryOnAsset ? (
                    <model-viewer
                      src={product.tryOnAsset}
                      camera-controls
                      disable-pan
                      disable-zoom
                      shadow-intensity="0.2"
                      interaction-prompt="auto"
                      style={{
                        width: "100%",
                        height: "260px",
                        background: "transparent",
                      }}
                    />
                  ) : (
                    <div className="flex h-[260px] items-center justify-center px-4 text-center text-sm text-slate-400">
                      Upload a 3D sunglasses model to preview it here.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/5 p-5 sm:p-6">
              <h2 className="text-2xl font-semibold">Fit Controls</h2>
              <p className="mt-2 text-sm text-slate-300">
                Fine-tune the 3D model placement and scale if your specific glasses need
                a small calibration adjustment.
              </p>

              <div className="mt-5 space-y-4">
                <label className="block text-sm text-slate-300">
                  Horizontal Offset
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={adjustments.offsetX}
                    onChange={(event) =>
                      setAdjustments((current) => ({
                        ...current,
                        offsetX: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Vertical Offset
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    value={adjustments.offsetY}
                    onChange={(event) =>
                      setAdjustments((current) => ({
                        ...current,
                        offsetY: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Scale
                  <input
                    type="range"
                    min="0.6"
                    max="1.8"
                    step="0.05"
                    value={adjustments.scale}
                    onChange={(event) =>
                      setAdjustments((current) => ({
                        ...current,
                        scale: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
                <label className="block text-sm text-slate-300">
                  Tilt
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={adjustments.tilt}
                    onChange={(event) =>
                      setAdjustments((current) => ({
                        ...current,
                        tilt: Number(event.target.value),
                      }))
                    }
                    className="mt-2 w-full"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default VirtualTryOn;
