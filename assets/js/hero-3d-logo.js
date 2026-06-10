(async () => {
    const canvas = document.getElementById("himma-hero-3d");
    const stage = canvas?.closest(".hero-3d-stage");
    if (!canvas || !stage) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobileMedia = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    const isMobileLayout = mobileMedia.matches;
    if (isMobileLayout) {
        stage.dataset.state = "mobile-fallback";
        canvas.setAttribute("aria-hidden", "true");
        return;
    }

    const THREE = await import("../vendor/three.module.min.js");
    const { GLTFLoader } = await import("../vendor/GLTFLoader.js");
    const shouldAnimate = !reduceMotion;
    const modelUrl = "/models/hemma_logo_final.glb";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: isMobileLayout ? "low-power" : "high-performance"
    });
    const root = new THREE.Group();
    const pointer = { x: 0, y: 0 };
    const pointerTarget = { x: 0, y: 0 };

    let model = null;
    let isVisible = true;
    let frameId = 0;
    let lastWidth = 0;
    let lastHeight = 0;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobileLayout ? 1.25 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.04;

    scene.add(root);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x173426, 1.18));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2.5, 4.5, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xcfe8d8, 1.25);
    rimLight.position.set(-4, 2.5, -3);
    scene.add(rimLight);

    const redEdgeLight = new THREE.PointLight(0xce1126, 0.45, 14);
    redEdgeLight.position.set(-2.5, -1.4, 3.2);
    scene.add(redEdgeLight);

    function updateState(state) {
        window.__himmaHero3DState = {
            ...(window.__himmaHero3DState || {}),
            ...state
        };
    }

    function sizeRenderer() {
        const rect = stage.getBoundingClientRect();
        const width = Math.max(1, Math.round(rect.width));
        const height = Math.max(1, Math.round(rect.height));
        if (width === lastWidth && height === lastHeight) return false;

        lastWidth = width;
        lastHeight = height;
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        return true;
    }

    function fitCamera() {
        if (!model) return;

        root.rotation.set(0, 0, 0);
        const box = new THREE.Box3().setFromObject(root);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);
        const fov = THREE.MathUtils.degToRad(camera.fov);
        const distanceForHeight = size.y / (2 * Math.tan(fov / 2));
        const distanceForWidth = size.x / (2 * Math.tan(fov / 2) * camera.aspect);
        const distance = Math.max(distanceForHeight, distanceForWidth, maxDimension) * (isMobileLayout ? 2.05 : 1.75);

        camera.position.set(0, 0, distance);
        camera.near = Math.max(0.01, distance / 100);
        camera.far = distance * 100;
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();

        updateState({
            loaded: true,
            modelUrl,
            canvasCount: document.querySelectorAll("#home canvas").length,
            cameraDistance: Number(distance.toFixed(3)),
            modelHeight: Number(size.y.toFixed(3)),
            modelWidth: Number(size.x.toFixed(3))
        });
    }

    function centerAndScale(loadedModel) {
        const initialBox = new THREE.Box3().setFromObject(loadedModel);
        const center = initialBox.getCenter(new THREE.Vector3());
        const size = initialBox.getSize(new THREE.Vector3());
        const maxDimension = Math.max(size.x, size.y, size.z);

        loadedModel.position.sub(center);
        loadedModel.scale.setScalar(maxDimension > 0 ? 2.55 / maxDimension : 1);

        root.clear();
        root.add(loadedModel);
        model = loadedModel;
        fitCamera();
    }

    function tuneMaterials(object) {
        object.traverse((node) => {
            if (!node.isMesh) return;
            node.frustumCulled = false;

            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.filter(Boolean).forEach((material) => {
                material.side = THREE.DoubleSide;
                material.transparent = false;
                material.opacity = 1;
                material.depthWrite = true;
                if (material.map) {
                    material.map.colorSpace = THREE.SRGBColorSpace;
                }
                material.needsUpdate = true;
            });
        });
    }

    function render(time = 0) {
        frameId = 0;
        if (!isVisible || !model) return;

        pointer.x += (pointerTarget.x - pointer.x) * 0.04;
        pointer.y += (pointerTarget.y - pointer.y) * 0.04;

        if (!shouldAnimate) {
            root.rotation.set(0, 0, 0);
        } else {
            const slowY = Math.sin(time * 0.00022) * 0.08;
            root.rotation.y = slowY + pointer.x * 0.045;
            root.rotation.x = pointer.y * 0.025;
        }

        renderer.render(scene, camera);
        if (shouldAnimate) {
            frameId = window.requestAnimationFrame(render);
        }
    }

    function requestRender() {
        if (shouldAnimate) {
            if (!frameId) {
                frameId = window.requestAnimationFrame(render);
            }
            return;
        }
        render(0);
    }

    function handlePointer(event) {
        if (reduceMotion) return;
        const rect = stage.getBoundingClientRect();
        pointerTarget.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2, -1, 1);
        pointerTarget.y = THREE.MathUtils.clamp(-((event.clientY - rect.top) / rect.height - 0.5) * 2, -1, 1);
    }

    function resetPointer() {
        pointerTarget.x = 0;
        pointerTarget.y = 0;
    }

    sizeRenderer();

    new GLTFLoader().load(
        modelUrl,
        (gltf) => {
            tuneMaterials(gltf.scene);
            centerAndScale(gltf.scene);
            stage.dataset.state = "ready";
            requestRender();
        },
        undefined,
        () => {
            stage.dataset.state = "failed";
            updateState({ loaded: false, modelUrl });
        }
    );

    const resizeObserver = new ResizeObserver(() => {
        if (sizeRenderer()) {
            fitCamera();
            requestRender();
        }
    });
    resizeObserver.observe(stage);

    if ("IntersectionObserver" in window) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            isVisible = entries.some((entry) => entry.isIntersecting);
            if (isVisible) {
                requestRender();
            }
        }, { threshold: 0.05 });
        visibilityObserver.observe(stage);
    }

    if (shouldAnimate) {
        stage.addEventListener("pointermove", handlePointer, { passive: true });
        stage.addEventListener("pointerleave", resetPointer);
    }
    requestRender();

    window.addEventListener("pagehide", () => {
        if (frameId) {
            window.cancelAnimationFrame(frameId);
        }
        renderer.dispose();
    }, { once: true });
})();
