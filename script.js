
// ============ Phần thư thay ở đây ============
const CONFIG = {
	recipientName: "Em yêu",                      // Tên người nhận
	senderName: "Anh",                            // Tên người gửi
	photoSrc: "",                        // 
	lockPassword: "231003",             // Mật khẩu để mở thiệp (chỉ số). Ví dụ: "000000"
	message: `Chúc mừng sinh nhật em yêu.
Hôm nay là ngày của em, và anh chỉ mong em luôn vui vẻ, khỏe mạnh, bình an và gặp thật nhiều điều may mắn.
Cảm ơn em vì đã ở bên anh, mang đến sự ấm áp và những khoảnh khắc mà anh luôn trân trọng.
Tuổi mới, anh mong em luôn rạng rỡ, tự tin làm điều mình thích, và luôn nhớ rằng anh thương em rất nhiều.

Em chính là ánh sáng và niềm vui lớn nhất của anh. Anh sẽ luôn bên em, yêu thương và hỗ trợ em vì mọi ước mơ.
Hãy cứ tin tưởng vào bản thân em, vì anh luôn tin em có thể làm được tất cả. Anh thương em vô cùng!`
};
// =======================================


// === INTRO Ban đầu ===
const INTRO_LINES = [
	{ text: "Hôm nay là sinh nhật của em", pause: 2200 },
	{ text: "Anh có một món quà nhỏ dành cho em", pause: 1600 },
	// { text: "Mở khóa để nhận quà", pause: 1800, dots: true },
];

function runIntro(onComplete) {
	const screen = document.getElementById('introScreen');
	const line = document.getElementById('introLine');
	const heart = document.getElementById('introHeart');

	// show heart
	if (heart) {
		setTimeout(() => heart.classList.add('show'), 300);
	}

	let i = 0;
	function showNext() {
		if (i >= INTRO_LINES.length) {
			// Done — hide intro and invoke completion callback if present
			line.classList.add('fade-out');
			if (heart) heart.style.opacity = '0';
			setTimeout(() => {
				screen.classList.add('hidden');
				if (typeof onComplete === 'function') onComplete();
				else showLockScreen();
			}, 700);
			return;
		}

		const item = INTRO_LINES[i];
		// Reset line
		line.classList.remove('show', 'fade-out');
		line.textContent = '';

		// Small delay between lines
		setTimeout(() => {
			if (item.dots) {
				// Type with trailing dots animation
				line.innerHTML = item.text + ' <span class="intro-dot">.</span><span class="intro-dot">.</span><span class="intro-dot">.</span>';
			} else {
				line.textContent = item.text;
			}
			line.classList.add('show');
			i++;

			setTimeout(() => {
				line.classList.add('fade-out');
				setTimeout(showNext, 500);
			}, item.pause);
		}, 300);
	}

	showNext();
}

// === LOCK SCREEN (password) ===
let lockInput = '';

function isLockEnabled() {
	return !!(CONFIG.lockPassword && String(CONFIG.lockPassword).length > 0);
}

function shouldBypassLockOnMobile() {
	return !!(window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches);
}

function setCakeVisible(visible) {
	const scene = document.getElementById('cakeScene');
	if (!scene) return;
	scene.classList.toggle('is-hidden', !visible);
	if (visible) {
		scene.classList.add('animate-start');
		// Trigger SVG animations
		const biz1 = document.getElementById('bizcocho_1');
		if (biz1 && typeof biz1.beginElement === 'function') {
			setTimeout(() => {
				biz1.beginElement();
			}, 1000);
		}
	} else {
		scene.classList.remove('animate-start');
	}
}

function setSceneTitleVisible(visible) {
	const title = document.querySelector('.scene-title');
	if (!title) return;
	title.classList.toggle('is-hidden', !visible);
}

function showLockScreen() {
	if (shouldBypassLockOnMobile()) {
		const lock = document.getElementById('lockScreen');
		const lockPanel = document.querySelector('.lock-panel');
		if (lock) {
			lock.classList.remove('is-hidden');
			lock.setAttribute('aria-hidden', 'false');
		}
		if (lockPanel) lockPanel.classList.remove('is-closed');
		setSceneTitleVisible(true);
		resetLockInput();
		return;
	}

	if (!isLockEnabled()) {
		setSceneTitleVisible(true);
		setCakeVisible(true);
		return;
	}

	const lock = document.getElementById('lockScreen');
	if (!lock) {
		setCakeVisible(true);
		return;
	}

	lock.classList.remove('is-hidden');
	lock.setAttribute('aria-hidden', 'false');
	setSceneTitleVisible(true);
	resetLockInput();
}

function hideLockScreen() {
	const lock = document.getElementById('lockScreen');
	if (!lock) return;
	lock.classList.add('is-hidden');
	lock.setAttribute('aria-hidden', 'true');
}

function resetLockInput() {
	lockInput = '';
	updateLockDisplay();
}

function updateLockDisplay() {
	const bar = document.getElementById('lockBar');
	const textEl = document.getElementById('lockBarText');
	if (!bar || !textEl) return;

	const expectedLen = String(CONFIG.lockPassword || '').length || 1;
	const pct = Math.min(100, Math.round((lockInput.length / expectedLen) * 100));
	bar.style.setProperty('--fill', `${pct}%`);
	bar.classList.toggle('is-charging', lockInput.length > 0 && lockInput.length < expectedLen);

	// Show only the "energy" fill — no dots / no characters in the bar.
	textEl.textContent = '';
}

function flashLockState(state) {
	const bar = document.getElementById('lockBar');
	if (!bar) return;
	bar.classList.remove('is-ok', 'is-wrong');
	if (state === 'ok') bar.classList.add('is-ok');
	if (state === 'wrong') bar.classList.add('is-wrong');
	window.setTimeout(() => bar.classList.remove('is-ok', 'is-wrong'), 520);
}

function tryUnlock() {
	const expected = String(CONFIG.lockPassword || '');
	if (!expected) return;
	if (lockInput.length < expected.length) return;
	if (lockInput === expected) {
		flashLockState('ok');
		// On correct password: hide lock, show intro; after intro finishes, show envelope
		hideLockScreen();

		// Ensure intro screen is visible
		const intro = document.getElementById('introScreen');
		if (intro) intro.classList.remove('hidden');

		// Run intro and when finished show the envelope and start title cycler
		runIntro(() => {
				setSceneTitleVisible(true);
				setCakeVisible(true);
			startSceneTitleCycler();
		});
		return;
	}
	// Wrong password: reset
	flashLockState('wrong');
	resetLockInput();
}

function onLockDigit(d) {
	const expected = String(CONFIG.lockPassword || '');
	if (!expected) return;
	if (lockInput.length >= expected.length) return;
	lockInput += String(d);
	updateLockDisplay();
	tryUnlock();
}

function onLockBack() {
	if (!lockInput) return;
	lockInput = lockInput.slice(0, -1);
	updateLockDisplay();
}

function onLockClear() {
	resetLockInput();
}

function initLockEvents() {
	const keypad = document.getElementById('lockKeypad');
	const lockPanel = document.querySelector('.lock-panel');

	if (lockPanel) {
		lockPanel.addEventListener('click', (e) => {
			if (lockPanel.classList.contains('is-closed')) {
				lockPanel.classList.remove('is-closed');
				startMusic();
			}
		});
	}

	if (!keypad) return;

	keypad.addEventListener('click', (e) => {
		if (lockPanel && lockPanel.classList.contains('is-closed')) return;
		const btn = e.target && e.target.closest ? e.target.closest('button') : null;
		if (!btn) return;
		const digit = btn.getAttribute('data-digit');
		const action = btn.getAttribute('data-action');
		if (digit != null) onLockDigit(digit);
		else if (action === 'back') onLockBack();
		else if (action === 'clear') onLockClear();
	});

	// Physical keyboard support
	document.addEventListener('keydown', (e) => {
		const lock = document.getElementById('lockScreen');
		if (!lock || lock.classList.contains('is-hidden')) return;
		if (lockPanel && lockPanel.classList.contains('is-closed')) return;
		if (e.key >= '0' && e.key <= '9') {
			onLockDigit(e.key);
			return;
		}
		if (e.key === 'Backspace') {
			onLockBack();
			return;
		}
		if (e.key === 'Escape') {
			onLockClear();
		}
	});

	// Add ripple effect on pointerdown for each key
	Array.from(keypad.querySelectorAll('button')).forEach((btn) => {
		btn.addEventListener('pointerdown', (ev) => {
			const rect = btn.getBoundingClientRect();
			const x = ev.clientX - rect.left;
			const y = ev.clientY - rect.top;
			const r = document.createElement('span');
			r.className = 'ripple';
			r.style.left = (x - 6) + 'px';
			r.style.top = (y - 6) + 'px';
			btn.appendChild(r);
			setTimeout(() => r.remove(), 600);
		}, { passive: true });
	});
}

let typingInterval;
let titleInterval;
let typingCursor;

function setDate() {
	const el = document.getElementById('letterDate');
	if (!el) return;

	const custom = (CONFIG.dateText || '').trim();
	if (custom) {
		el.textContent = custom;
		return;
	}

	// If user already typed something (contenteditable) or hard-coded it in HTML, don't overwrite.
	if ((el.textContent || '').trim()) return;

	const now = new Date();
	el.textContent = now.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function createPetals() {
	// Replace petals with floating hearts effect
	const container = document.getElementById('petals');
	if (!container) return;
	if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

	// Clear existing
	container.innerHTML = '';

	const heartChars = ['❤', '💖', '💕', '💓'];
	const count = 22;
	for (let i = 0; i < count; i++) {
		const h = document.createElement('div');
		h.className = 'floating-heart';
		h.textContent = heartChars[Math.floor(Math.random() * heartChars.length)];
		// horizontal position
		h.style.left = (Math.random() * 90 + 5) + 'vw';
		// size (pass to CSS via custom property)
		const size = 14 + Math.floor(Math.random() * 28);
		h.style.setProperty('--size', size + 'px');
		h.style.width = size + 'px';
		h.style.height = size + 'px';
		// duration and delay
		const dur = 4 + Math.random() * 6;
		h.style.animationDuration = dur + 's';
		h.style.animationDelay = (-Math.random() * dur) + 's';
		// horizontal drift
		h.style.setProperty('--drift', (Math.random() * 60 - 30) + 'px');
		// use a CSS-drawn heart instead of emoji
		h.innerHTML = '<span class="heart-shape" aria-hidden="true"></span>';
		container.appendChild(h);
	}
}

function burstHearts(cx, cy, count = 24) {
	const container = document.getElementById('heartsBurst');
	if (!container) return;
	const emojis = ['❤️','💕','🌸','💖','💝','✨','💗','💓'];
	for (let i = 0; i < count; i++) {
		const h = document.createElement('span');
		h.className = 'burst-heart';
		h.textContent = emojis[Math.floor(Math.random()*emojis.length)];
		const angle = Math.random() * Math.PI * 2;
		const dist = 50 + Math.random() * 130;
		h.style.left = cx + 'px';
		h.style.top = cy + 'px';
		const scale = 0.8 + Math.random() * 0.8;
		h.style.fontSize = scale + 'rem';
		h.style.setProperty('--tx', Math.cos(angle)*dist + 'px');
		h.style.setProperty('--ty', Math.sin(angle)*dist + 'px');
		h.style.animationDelay = (Math.random()*0.15) + 's';
		container.appendChild(h);
		setTimeout(() => h.remove(), 1500);
	}
}

function openLetterPopup() {
	const overlay = document.getElementById('letterOverlay');
	if (!overlay) return;

	// Start music on user gesture when possible.
	startMusic();

	// Show floating hearts above the cake (template-like)
	const cakeEl = document.getElementById('cake');
	// On touch devices, avoid hover-only effects
	const canHover = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
	if (cakeEl && canHover) cakeEl.classList.add('is-open');

	// Burst hearts from the cake position
	if (cakeEl) {
		const rect = cakeEl.getBoundingClientRect();
		burstHearts(rect.left + rect.width / 2, rect.top + rect.height / 2);
	}

	overlay.classList.add('visible');
	overlay.setAttribute('aria-hidden', 'false');
	setGiftButtonVisible(false);

	applyLetterPhoto();
	startLetterTyping();
}

function closeLetterPopup() {
	const overlay = document.getElementById('letterOverlay');
	if (!overlay) return;
	overlay.classList.remove('visible');
	overlay.setAttribute('aria-hidden', 'true');
	setGiftButtonVisible(false);
	const cakeEl = document.getElementById('cake');
	if (cakeEl) cakeEl.classList.remove('is-open');
	stopTyping();
}

function stopTyping() {
	if (typingInterval) {
		clearInterval(typingInterval);
		typingInterval = undefined;
	}
	if (titleInterval) {
		clearInterval(titleInterval);
		titleInterval = undefined;
	}
	if (typingCursor) {
		typingCursor.remove();
		typingCursor = undefined;
	}
}

function applyLetterPhoto() {
	const img = document.getElementById('letterImg');
	if (!img) return;
	const wrapper = img.closest('.letter-photo');

	const configSrc = (CONFIG.photoSrc || '').trim();
	const htmlSrc = (img.getAttribute('src') || '').trim();
	const finalSrc = configSrc || htmlSrc;

	if (finalSrc) {
		img.src = finalSrc;
		img.style.display = 'block';
		if (wrapper) wrapper.classList.add('has-photo');
	} else {
		img.style.display = 'none';
		if (wrapper) wrapper.classList.remove('has-photo');
	}
}

function startLetterTyping() {
	stopTyping();
	setGiftButtonVisible(false);

	const greetingEl = document.getElementById('letterGreeting');
	const bodyEl = document.getElementById('letterBody');
	const sigEl = document.getElementById('letterSig');
	if (!bodyEl || !sigEl) return;

	if (greetingEl) greetingEl.textContent = `Gửi ${CONFIG.recipientName},`;
	bodyEl.textContent = '';
	sigEl.textContent = '';
	sigEl.style.opacity = '0';

	startMessageTyping(bodyEl, sigEl);
}

function startMessageTyping(bodyEl, sigEl) {
	const cursor = document.createElement('span');
	cursor.className = 'cursor';
	bodyEl.appendChild(cursor);
	typingCursor = cursor;

	const text = CONFIG.message;
	let i = 0;

	typingInterval = setInterval(() => {
		if (i < text.length) {
			const ch = text[i];
			cursor.before(ch === '\n' ? document.createElement('br') : document.createTextNode(ch));
			i++;
			return;
		}

		clearInterval(typingInterval);
		typingInterval = undefined;
		cursor.remove();
		typingCursor = undefined;

		setTimeout(() => {
			sigEl.textContent = CONFIG.senderName;
			sigEl.style.opacity = '1';
			setGiftButtonVisible(true);
		}, 350);
	}, 28);
}

function setGiftButtonVisible(visible) {
	const btn = document.getElementById('giftBtn');
	if (!btn) return;
	btn.classList.toggle('is-visible', !!visible);
	btn.disabled = !visible;
}

function applyGiftVideoSrc() {
	const video = document.getElementById('giftVideo');
	if (!video) return;
	const src = (CONFIG.giftVideoSrc || '').trim();
	if (!src) return;

	const source = video.querySelector('source');
	if (source) {
		source.src = src;
		video.load();
		return;
	}

	video.src = src;
	video.load();
}

// === thay nội dung chữ rơi và ảnh ở đây ===
const FINAL_MESSAGES = [
	"Chúc mừng sinh nhật công chúa của anh!",
	"Tuổi mới thật rực rỡ nhé",
	"Mãi xinh đẹp, vui vẻ và thành công nha",
	"Ngày càng xinh đẹp và thành công nha",
	"Yêu em nhìu lắm",
	"I love you pac pac",
	"Ngày hôm nay là ngày của em...",
	"Yêu em nhìu lắm",
	"I love you pac pac",
	"Ngày hôm nay là ngày của em...",
];

const FINAL_IMAGES = [
	"image/anh1.jpg",
	"image/anh2.jpg",
	"image/anh4.jpg",
	"image/anh5.jpg",
	"image/anh7.jpg",
	"image/anh8.jpg",
	"image/anh3.jpg",
	"image/anh6.jpg",
];

	// Bắt đầu/lưu ý: hàm cho phép đổi chữ của tiêu đề cảnh khi mở khóa thành công
	function startSceneTitleCycler(intervalMs = 2000) {
		const titleEl = document.querySelector('.scene-title');
		if (!titleEl) return;
		if (titleInterval) clearInterval(titleInterval);
		titleEl.classList.remove('is-hidden');
		titleEl.textContent = randomFrom(FINAL_MESSAGES);
		titleInterval = setInterval(() => {
			titleEl.textContent = randomFrom(FINAL_MESSAGES);
		}, intervalMs);
	}

	function stopSceneTitleCycler() {
		if (titleInterval) {
			clearInterval(titleInterval);
			titleInterval = undefined;
		}
	}

let finalTimer;
let finalZoom = 1;
let finalThree = null;

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js';
const ORBIT_CDN = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';

function getFinalCanvas() {
	return document.getElementById('finalCanvas');
}

function isThreeFinalActive() {
	return !!(finalThree && finalThree.running);
}

function loadExternalScript(src) {
	return new Promise((resolve, reject) => {
		const existing = document.querySelector(`script[src="${src}"]`);
		if (existing) {
			if (existing.getAttribute('data-loaded') === 'true') {
				resolve();
				return;
			}
			existing.addEventListener('load', () => resolve(), { once: true });
			existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
			return;
		}

		const s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.addEventListener('load', () => {
			s.setAttribute('data-loaded', 'true');
			resolve();
		}, { once: true });
		s.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
		document.head.appendChild(s);
	});
}

async function ensureThreeFinalDeps() {
	if (window.THREE && window.THREE.OrbitControls) return;
	if (!window.THREE) await loadExternalScript(THREE_CDN);
	if (!window.THREE || !window.THREE.OrbitControls) await loadExternalScript(ORBIT_CDN);
}

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

function setFinalZoom(next) {
	finalZoom = clamp(Number(next) || 1, 0.65, 2.6);
	const canvas = getFinalCanvas();
	if (canvas) canvas.style.setProperty('--final-zoom', String(finalZoom));
}

function clearFinalCanvas() {
	const canvas = getFinalCanvas();
	if (!canvas) return;
	canvas.innerHTML = '';
}

function randomFrom(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function makeThreeTextCanvas(message, fontFamily) {
	const isMobile = window.innerWidth <= 768;
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	const baseFontSize = isMobile ? 56 : 84;
	const baseTextHeight = isMobile ? 90 : 120;
	const paddingW = isMobile ? 48 : 70;
	const paddingH = isMobile ? 30 : 44;

	ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
	const textWidth = Math.ceil(ctx.measureText(message).width);

	canvas.width = Math.max(textWidth + paddingW, isMobile ? 260 : 320);
	canvas.height = baseTextHeight + paddingH;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = `700 ${baseFontSize}px ${fontFamily}`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.shadowColor = 'rgba(231, 84, 128, 0.35)';
	ctx.shadowBlur = 18;
	ctx.lineWidth = 1;
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
	ctx.fillStyle = '#f35d88';
	ctx.strokeText(message, canvas.width / 2, canvas.height / 2);
	ctx.fillText(message, canvas.width / 2, canvas.height / 2);

	return canvas;
}

function disposeThreeFinal() {
	if (!finalThree) return;
	finalThree.running = false;

	if (typeof finalThree.animationId === 'number') {
		window.cancelAnimationFrame(finalThree.animationId);
	}

	if (finalThree.resizeHandler) {
		window.removeEventListener('resize', finalThree.resizeHandler);
	}

	if (finalThree.controls && typeof finalThree.controls.dispose === 'function') {
		finalThree.controls.dispose();
	}

	for (const mesh of finalThree.textObjects || []) {
		if (mesh.material && mesh.material.map) mesh.material.map.dispose();
		if (mesh.material) mesh.material.dispose();
		if (mesh.geometry) mesh.geometry.dispose();
	}

	for (const mesh of finalThree.imageObjects || []) {
		if (mesh.children && mesh.children.length) {
			for (const child of mesh.children) {
				if (child.material) child.material.dispose();
				if (child.geometry) child.geometry.dispose();
			}
		}
		if (mesh.material && mesh.material.map) mesh.material.map.dispose();
		if (mesh.material) mesh.material.dispose();
		if (mesh.geometry) mesh.geometry.dispose();
	}

	if (finalThree.renderer) {
		finalThree.renderer.dispose();
		if (finalThree.renderer.domElement && finalThree.renderer.domElement.parentNode) {
			finalThree.renderer.domElement.parentNode.removeChild(finalThree.renderer.domElement);
		}
	}

	finalThree = null;
}

function createThreeFinalEffect() {
	if (!window.THREE) return;

	const canvasHost = getFinalCanvas();
	if (!canvasHost) return;

	canvasHost.classList.add('is-three');
	canvasHost.innerHTML = '';

	const scene = new window.THREE.Scene();
	const camera = new window.THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
	camera.position.set(0, 10, 70);

	const renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setPixelRatio(window.devicePixelRatio || 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.style.width = '100%';
	renderer.domElement.style.height = '100%';
	canvasHost.appendChild(renderer.domElement);

	const ambient = new window.THREE.AmbientLight(0xffffff, 1.0);
	scene.add(ambient);

	let controls = null;
	if (window.THREE.OrbitControls) {
		controls = new window.THREE.OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;
		controls.dampingFactor = 0.07;
		controls.enableRotate = true;
		controls.enablePan = true;
		controls.enableZoom = true;
		controls.minDistance = 10;
		controls.maxDistance = 180;
	}

	const textObjects = [];
	const imageObjects = [];
	const textureCache = Object.create(null);
	const textureLoader = new window.THREE.TextureLoader();

	const updateImageGeometry = (texture, mesh, baseSize) => {
		if (!texture || !texture.image || !mesh) return;
		const aspect = texture.image.width / texture.image.height;
		let w;
		let h;

		if (aspect > 1) {
			w = baseSize;
			h = baseSize / aspect;
		} else {
			w = baseSize * aspect;
			h = baseSize;
		}

		if (mesh.geometry) mesh.geometry.dispose();
		mesh.geometry = new window.THREE.PlaneGeometry(w, h);
	};

	const makeImageMesh = (imagePath) => {
		const baseSize = window.innerWidth <= 768 ? 10 : 14;
		const geometry = new window.THREE.PlaneGeometry(baseSize, baseSize);
		const material = new window.THREE.MeshBasicMaterial({
			map: null,
			transparent: true,
			side: window.THREE.DoubleSide
		});

		const mesh = new window.THREE.Mesh(geometry, material);
		mesh.userData.speed = 0.09 + Math.random() * 0.06;
		mesh.userData.pattern = Math.floor(Math.random() * 3);

		const borderGeometry = new window.THREE.PlaneGeometry(baseSize, baseSize);
		const borderMaterial = new window.THREE.MeshBasicMaterial({
			color: 0xffffff,
			transparent: true,
			opacity: 1,
			side: window.THREE.DoubleSide,
			depthWrite: false
		});
		const borderMesh = new window.THREE.Mesh(borderGeometry, borderMaterial);
		borderMesh.position.z = -0.02;
		borderMesh.scale.set(1.04, 1.04, 1);
		mesh.add(borderMesh);
		mesh.userData.borderMesh = borderMesh;

		const syncBorderGeometry = () => {
			if (!mesh.userData.borderMesh || !mesh.geometry) return;
			if (mesh.userData.borderMesh.geometry) mesh.userData.borderMesh.geometry.dispose();
			mesh.userData.borderMesh.geometry = mesh.geometry.clone();
			mesh.userData.borderMesh.scale.set(1.04, 1.04, 1);
		};

		const cached = textureCache[imagePath];
		if (cached) {
			material.map = cached;
			material.needsUpdate = true;
			updateImageGeometry(cached, mesh, baseSize);
			syncBorderGeometry();
		} else {
			const tex = textureLoader.load(imagePath, (loaded) => {
				textureCache[imagePath] = loaded;
				material.map = loaded;
				material.needsUpdate = true;
				updateImageGeometry(loaded, mesh, baseSize);
				syncBorderGeometry();
			});
			textureCache[imagePath] = tex;
			material.map = tex;
			material.needsUpdate = true;
			updateImageGeometry(tex, mesh, baseSize);
			syncBorderGeometry();
		}

		return mesh;
	};

	const createSceneObjects = () => {
		for (const mesh of textObjects) {
			scene.remove(mesh);
			if (mesh.material && mesh.material.map) mesh.material.map.dispose();
			if (mesh.material) mesh.material.dispose();
			if (mesh.geometry) mesh.geometry.dispose();
		}
		for (const mesh of imageObjects) {
			scene.remove(mesh);
			if (mesh.material) mesh.material.dispose();
			if (mesh.geometry) mesh.geometry.dispose();
		}
		textObjects.length = 0;
		imageObjects.length = 0;

		const textCount = 60;
		const imageCount = 35;
		const fontFamily = "'Pacifico', 'Quicksand', cursive, sans-serif";

		for (let i = 0; i < textCount; i++) {
			const msg = randomFrom(FINAL_MESSAGES);
			const textCanvas = makeThreeTextCanvas(msg, fontFamily);
			const texture = new window.THREE.CanvasTexture(textCanvas);
			texture.needsUpdate = true;

			const material = new window.THREE.MeshBasicMaterial({
				map: texture,
				transparent: true,
				side: window.THREE.DoubleSide
			});

			const isMobile = window.innerWidth <= 768;
			const widthScale = isMobile ? 14 : 20;
			const heightScale = isMobile ? 7 : 10;

			const geoW = (textCanvas.width / 512) * widthScale;
			const geoH = (textCanvas.height / 256) * heightScale;
			const geometry = new window.THREE.PlaneGeometry(geoW, geoH);

			const mesh = new window.THREE.Mesh(geometry, material);
			mesh.position.set((Math.random() - 0.5) * 90, 40 + i * 1.6, (Math.random() - 0.5) * 90);
			mesh.userData.speed = 0.12 + Math.random() * 0.08;
			scene.add(mesh);
			textObjects.push(mesh);
		}

		for (let i = 0; i < imageCount; i++) {
			const imagePath = randomFrom(FINAL_IMAGES);
			const imgMesh = makeImageMesh(imagePath);
			imgMesh.position.set((Math.random() - 0.5) * 90, 45 + i * 4.2, (Math.random() - 0.5) * 90);
			scene.add(imgMesh);
			imageObjects.push(imgMesh);
		}
	};

	const resizeHandler = () => {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		createSceneObjects();
	};

	window.addEventListener('resize', resizeHandler);

	finalThree = {
		running: true,
		renderer,
		scene,
		camera,
		controls,
		textObjects,
		imageObjects,
		resizeHandler,
		animationId: 0
	};

	const animate = () => {
		if (!finalThree || !finalThree.running) return;
		finalThree.animationId = window.requestAnimationFrame(animate);

		for (const obj of textObjects) {
			obj.position.y -= obj.userData.speed;
			if (obj.position.y < -70) {
				obj.position.y = 45 + Math.random() * 40;
				obj.position.x = (Math.random() - 0.5) * 90;
				obj.position.z = (Math.random() - 0.5) * 90;
			}
		}

		for (const imgObj of imageObjects) {
			imgObj.position.y -= imgObj.userData.speed;
			const pattern = imgObj.userData.pattern;
			if (pattern === 1) imgObj.position.x -= 0.03;
			else if (pattern === 2) imgObj.position.x += 0.03;

			if (imgObj.position.y < -85) {
				imgObj.position.y = 55 + Math.random() * 40;
				imgObj.position.x = (Math.random() - 0.5) * 90;
				imgObj.position.z = (Math.random() - 0.5) * 90;
				imgObj.userData.pattern = Math.floor(Math.random() * 3);
			}
		}

		if (controls) controls.update();
		renderer.render(scene, camera);
	};

	if (document.fonts && document.fonts.ready) {
		document.fonts.ready.then(() => {
			if (!finalThree || !finalThree.running) return;
			createSceneObjects();
			animate();
		});
	} else {
		createSceneObjects();
		animate();
	}
}

function spawnFinalItem() {
	const canvas = getFinalCanvas();
	if (!canvas) return;

	const isMobile = window.matchMedia && window.matchMedia('(max-width: 520px)').matches;
	const makeImage = Math.random() < 0.35;
	const left = Math.random() * 100;
	const dur = 7 + Math.random() * 6;
	// Straight down (no horizontal drift / rotation)
	const dx = 0;
	const rot = 0;
	const delay = -Math.random() * (dur * 0.65);

	const el = document.createElement('div');
	el.className = 'final-item ' + (makeImage ? 'final-img' : 'final-text');
	el.style.left = left + 'vw';
	el.style.setProperty('--dur', dur + 's');
	el.style.setProperty('--dx', dx + 'px');
	el.style.setProperty('--rot', rot + 'deg');
	el.style.animationDelay = delay + 's';

	if (makeImage) {
		const img = document.createElement('img');
		img.decoding = 'async';
		img.alt = 'Ảnh';
		img.src = randomFrom(FINAL_IMAGES);
		// Bigger photos as requested
		const base = isMobile ? 92 : 128;
		const size = base + Math.floor(Math.random() * (isMobile ? 46 : 86));
		el.style.setProperty('--size', size + 'px');
		el.appendChild(img);
	} else {
		el.textContent = randomFrom(FINAL_MESSAGES);
	}

	canvas.appendChild(el);

	const removeAfterMs = Math.max(0, (dur + 0.2) * 1000);
	window.setTimeout(() => {
		if (el && el.parentNode) el.parentNode.removeChild(el);
	}, removeAfterMs);
}

function startFinalEffect() {
	stopFinalEffect();
	clearFinalCanvas();
	setFinalZoom(1);

	ensureThreeFinalDeps()
		.then(() => {
			createThreeFinalEffect();
		})
		.catch(() => {
			// Fallback to the existing DOM effect if CDN cannot be loaded.
			for (let i = 0; i < 18; i++) spawnFinalItem();
			finalTimer = window.setInterval(spawnFinalItem, 260);
		});
}

function stopFinalEffect() {
	disposeThreeFinal();
	const canvas = getFinalCanvas();
	if (canvas) canvas.classList.remove('is-three');

	if (finalTimer) {
		window.clearInterval(finalTimer);
		finalTimer = undefined;
	}
	setFinalZoom(1);
	clearFinalCanvas();
}

function attemptFullscreen(video) {
	if (!video) return;
	const screen = document.getElementById('videoScreen');

	// Standard Fullscreen API (Android/desktop)
	const target = screen || video;
	const request =
		(target.requestFullscreen ||
			target.webkitRequestFullscreen ||
			target.msRequestFullscreen);
	if (typeof request === 'function') {
		try {
			request.call(target);
		} catch {
			// ignore
		}
	}

	// iOS Safari fallback
	if (typeof video.webkitEnterFullscreen === 'function') {
		try {
			video.webkitEnterFullscreen();
		} catch {
			// ignore
		}
	}
}

function openGiftVideo() {
	const screen = document.getElementById('videoScreen');
	const overlay = document.getElementById('letterOverlay');
	if (!screen) return;

	// Close letter UI, open video UI
	if (overlay) {
		overlay.classList.remove('visible');
		overlay.setAttribute('aria-hidden', 'true');
	}
	setGiftButtonVisible(false);
	stopTyping();

	screen.classList.add('visible');
	screen.setAttribute('aria-hidden', 'false');
	startFinalEffect();
}

function closeGiftVideo() {
	const screen = document.getElementById('videoScreen');
	if (!screen) return;
	stopFinalEffect();

	screen.classList.remove('visible');
	screen.setAttribute('aria-hidden', 'true');
}

let musicPlaying = false;

function startMusic() {
	const audio = document.getElementById('bgMusic');
	if (!audio) return Promise.resolve(false);

	audio.volume = 0.3;
	const p = audio.play();
	if (p && typeof p.then === 'function') {
		return p
			.then(() => {
				musicPlaying = true;
				return true;
			})
			.catch(() => false);
	}

	// Older browsers may not return a promise
	musicPlaying = true;
	return Promise.resolve(true);
}

// If autoplay is blocked on load, retry at the first user interaction (tap/click/keydown).
function armAutoplayRetry() {
	const attempt = () => {
		startMusic().then((ok) => {
			if (ok) cleanup();
		});
	};

	const cleanup = () => {
		document.removeEventListener('pointerdown', attempt);
		document.removeEventListener('keydown', attempt);
	};

	document.addEventListener('pointerdown', attempt, { passive: true });
	document.addEventListener('keydown', attempt);
	}

	setDate();
	// Show lock screen first (hide intro on load)
	try {
		const introScreen = document.getElementById('introScreen');
		if (introScreen) introScreen.classList.add('hidden');
	} catch (e) { /* ignore */ }
	showLockScreen();
	createPetals(); // start floating hearts effect
	applyGiftVideoSrc();
	setCakeVisible(false);
	initLockEvents();
	armAutoplayRetry();
	startMusic();

// Events for template-like initial letter
(function initLetterEvents() {
	const cake = document.getElementById('cake');
	const sliceBtn = document.getElementById('sliceBtn');
	const overlay = document.getElementById('letterOverlay');
	const giftBtn = document.getElementById('giftBtn');
	const videoExitBtn = document.getElementById('videoExitBtn');
	const videoScreen = document.getElementById('videoScreen');
	let lastTouchAt = 0;

	const openFromTap = (e) => {
		// Avoid double-fire: touchstart is often followed by a synthetic click.
		if (e && e.type === 'touchstart') {
			lastTouchAt = Date.now();
			if (e.cancelable) e.preventDefault();
		}
		if (e && e.type === 'click' && Date.now() - lastTouchAt < 650) return;
		attemptCakeSlice(e);
	};

	const attemptCakeSlice = (e) => {
		const cakeEl = document.getElementById('cake');
		
		// Burst hearts immediately from the click coordinates or the cake center!
		let cx, cy;
		if (e && typeof e.clientX === 'number' && e.clientX > 0) {
			cx = e.clientX;
			cy = e.clientY;
		} else if (cakeEl) {
			const rect = cakeEl.getBoundingClientRect();
			cx = rect.left + rect.width / 2;
			cy = rect.top + rect.height / 2;
		}
		if (cx != null && cy != null) {
			burstHearts(cx, cy, 32); // Explode 32 beautiful hearts!
		}

		if (cakeEl) {
			cakeEl.classList.add('is-slicing');
			setTimeout(() => {
				cakeEl.classList.remove('is-slicing');
				openLetterPopup();
			}, 1000);
			return;
		}
		openLetterPopup();
	};

	if (cake) {
		cake.addEventListener('click', openFromTap);
		cake.addEventListener('touchstart', openFromTap, { passive: false });
		cake.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				attemptCakeSlice(e);
			}
		});
	}

	if (sliceBtn) {
		sliceBtn.addEventListener('click', attemptCakeSlice);
	}

	// On mobile, decorative layers can sit above the card; handle taps on the whole envelope area.
	// No envelope area; cake element handles taps instead.

	if (overlay) {
		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) closeLetterPopup();
		});
	}

	if (giftBtn) {
		giftBtn.addEventListener('click', openGiftVideo);
	}

	if (videoExitBtn) {
		videoExitBtn.addEventListener('click', closeGiftVideo);
	}

	if (videoScreen) {
		videoScreen.addEventListener('click', (e) => {
			if (isThreeFinalActive()) return;
			// Click outside to close
			if (e.target === videoScreen) closeGiftVideo();
		});

		// Zoom (wheel on desktop, pinch on mobile)
		videoScreen.addEventListener('wheel', (e) => {
			if (isThreeFinalActive()) return;
			if (!videoScreen.classList.contains('visible')) return;
			// Prevent page scroll while zooming the overlay
			if (e.cancelable) e.preventDefault();
			const dir = e.deltaY < 0 ? 1 : -1;
			const factor = dir > 0 ? 1.08 : 0.92;
			setFinalZoom(finalZoom * factor);
		}, { passive: false });

		const pointers = new Map();
		let pinchStartDist = 0;
		let pinchStartZoom = 1;

		const dist = (a, b) => {
			const dx = (a.x - b.x);
			const dy = (a.y - b.y);
			return Math.hypot(dx, dy);
		};

		videoScreen.addEventListener('pointerdown', (e) => {
			if (isThreeFinalActive()) return;
			if (!videoScreen.classList.contains('visible')) return;
			// Only track direct interactions on the screen
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			try { videoScreen.setPointerCapture(e.pointerId); } catch { /* ignore */ }
			if (pointers.size === 2) {
				const pts = Array.from(pointers.values());
				pinchStartDist = dist(pts[0], pts[1]) || 1;
				pinchStartZoom = finalZoom;
			}
		}, { passive: true });

		videoScreen.addEventListener('pointermove', (e) => {
			if (isThreeFinalActive()) return;
			if (!videoScreen.classList.contains('visible')) return;
			if (!pointers.has(e.pointerId)) return;
			pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
			if (pointers.size !== 2) return;
			const pts = Array.from(pointers.values());
			const d = dist(pts[0], pts[1]) || 1;
			const ratio = d / (pinchStartDist || 1);
			setFinalZoom(pinchStartZoom * ratio);
			if (e.cancelable) e.preventDefault();
		}, { passive: false });

		const endPointer = (e) => {
			pointers.delete(e.pointerId);
			if (pointers.size < 2) {
				pinchStartDist = 0;
				pinchStartZoom = finalZoom;
			}
		};
		videoScreen.addEventListener('pointerup', endPointer, { passive: true });
		videoScreen.addEventListener('pointercancel', endPointer, { passive: true });
	}

	document.addEventListener('keydown', (e) => {
		if (e.key !== 'Escape') return;
		const screen = document.getElementById('videoScreen');
		if (screen && screen.classList.contains('visible')) closeGiftVideo();
	});
})();

