import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
// ---- KHỞI TẠO SCENE, CAMERA, RENDERER ----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100000
);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById("container").appendChild(renderer.domElement);

// ---- KHỞI TẠO CONTROLS ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

// ---- HÀM TIỆN ÍCH TẠO HIỆU ỨNG GLOW ----
function createGlowMaterial(color, size = 128, opacity = 0.55) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Sprite(material);
}

// ---- TẠO CÁC THÀNH PHẦN CỦA SCENE ----

// Glow trung tâm (giảm độ sáng)
const centralGlow = createGlowMaterial("rgba(255,255,255,0.3)", 156, 0.1);
centralGlow.scale.set(8, 8, 1);
scene.add(centralGlow);

// Các đám mây tinh vân (Nebula) ngẫu nhiên (giảm độ sáng)
for (let i = 0; i < 15; i++) {
  const hue = Math.random() * 360;
  const color = `hsla(${hue}, 80%, 50%, 0.2)`; // Giảm opacity từ 0.6 xuống 0.2
  const nebula = createGlowMaterial(color, 256);
  nebula.scale.set(100, 100, 1);
  nebula.position.set(
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175
  );
  scene.add(nebula);
}

// ---- TẠO THIÊN HÀ (GALAXY) ----
const galaxyParameters = {
  count: 100000,
  arms: 6,
  radius: 100,
  spin: 0.5,
  randomness: 0.2,
  randomnessPower: 20,
  insideColor: new THREE.Color(0x1a1a1a), // Đen nhạt
  outsideColor: new THREE.Color(0x333333), // Xám tối
};

// THÊM ẢNH Ở ĐÂY
const heartImages = [
  ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.heartImages
    ? window.dataLove2Loveloom.data.heartImages
    : []),
  "./image/1.jpg",
  "./image/2.jpg",
  "./image/3.jpg",
  "./image/4.jpg",
  "./image/5.jpg",
  "./image/6.jpg",
];

const textureLoader = new THREE.TextureLoader();
const numGroups = heartImages.length;

// --- LOGIC DÙNG NỘI SUY ---

// Mật độ điểm khi chỉ có 1 ảnh (cao nhất)
const maxDensity = 15000;
// Mật độ điểm khi có 10 ảnh trở lên (thấp nhất)
const minDensity = 4000;
// Số lượng ảnh tối đa mà chúng ta quan tâm để điều chỉnh
const maxGroupsForScale = 9;

let pointsPerGroup;

if (numGroups <= 1) {
  pointsPerGroup = maxDensity;
} else if (numGroups >= maxGroupsForScale) {
  pointsPerGroup = minDensity;
} else {
  const t = (numGroups - 1) / (maxGroupsForScale - 1);
  pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
}

if (pointsPerGroup * numGroups > galaxyParameters.count) {
  pointsPerGroup = Math.floor(galaxyParameters.count / numGroups);
}

console.log(`Số lượng ảnh: ${numGroups}, Điểm mỗi ảnh: ${pointsPerGroup}`);

const positions = new Float32Array(galaxyParameters.count * 3);
const colors = new Float32Array(galaxyParameters.count * 3);
let pointIdx = 0;

for (let i = 0; i < galaxyParameters.count; i++) {
  const radius =
    Math.pow(Math.random(), galaxyParameters.randomnessPower) *
    galaxyParameters.radius;
  const branchAngle =
    ((i % galaxyParameters.arms) / galaxyParameters.arms) * Math.PI * 2;
  const spinAngle = radius * galaxyParameters.spin;

  const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
  const randomY =
    (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
  const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
  const totalAngle = branchAngle + spinAngle;

  if (radius < 30 && Math.random() < 0.7) continue;

  const i3 = pointIdx * 3;
  positions[i3] = Math.cos(totalAngle) * radius + randomX;
  positions[i3 + 1] = randomY;
  positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;

  const mixedColor = new THREE.Color(0x2a2a2a); // Màu xám rất tối
  mixedColor.lerp(new THREE.Color(0x404040), radius / galaxyParameters.radius); // Xám nhạt hơn một chút
  mixedColor.multiplyScalar(0.1 + 0.1 * Math.random()); // Độ sáng rất thấp
  colors[i3] = mixedColor.r;
  colors[i3 + 1] = mixedColor.g;
  colors[i3 + 2] = mixedColor.b;

  pointIdx++;
}

const galaxyGeometry = new THREE.BufferGeometry();
galaxyGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions.slice(0, pointIdx * 3), 3)
);
galaxyGeometry.setAttribute(
  "color",
  new THREE.BufferAttribute(colors.slice(0, pointIdx * 3), 3)
);

const galaxyMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0.0 },
    uSize: { value: 50.0 * renderer.getPixelRatio() },
    uRippleTime: { value: -1.0 },
    uRippleSpeed: { value: 40.0 },
    uRippleWidth: { value: 20.0 },
  },
  vertexShader: `
        uniform float uSize;
        uniform float uTime;
        uniform float uRippleTime;
        uniform float uRippleSpeed;
        uniform float uRippleWidth;

        varying vec3 vColor;

        void main() {
            // Lấy màu gốc từ geometry (giống hệt vertexColors: true)
            vColor = color;

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            // ---- LOGIC HIỆU ỨNG GỢN SÓNG ----
            if (uRippleTime > 0.0) {
                float rippleRadius = (uTime - uRippleTime) * uRippleSpeed;
                float particleDist = length(modelPosition.xyz);

                float strength = 1.0 - smoothstep(rippleRadius - uRippleWidth, rippleRadius + uRippleWidth, particleDist);
                strength *= smoothstep(rippleRadius + uRippleWidth, rippleRadius - uRippleWidth, particleDist);

                if (strength > 0.0) {
                    vColor += vec3(strength * 2.0); // Làm màu sáng hơn khi sóng đi qua
                }
            }

            vec4 viewPosition = viewMatrix * modelPosition;
            gl_Position = projectionMatrix * viewPosition;
            // Dòng này làm cho các hạt nhỏ hơn khi ở xa, mô phỏng hành vi của PointsMaterial
            gl_PointSize = uSize / -viewPosition.z;
        }
    `,
  fragmentShader: `
        varying vec3 vColor;
        void main() {
            // Làm cho các hạt có hình tròn thay vì hình vuông
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;

            gl_FragColor = vec4(vColor, 1.0);
        }
    `,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  vertexColors: true,
});
const galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
scene.add(galaxy);

function createNeonTexture(image, size) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const aspectRatio = image.width / image.height;
  let drawWidth, drawHeight, offsetX, offsetY;
  if (aspectRatio > 1) {
    drawWidth = size;
    drawHeight = size / aspectRatio;
    offsetX = 0;
    offsetY = (size - drawHeight) / 2;
  } else {
    drawHeight = size;
    drawWidth = size * aspectRatio;
    offsetX = (size - drawWidth) / 2;
    offsetY = 0;
  }
  ctx.clearRect(0, 0, size, size);
  const cornerRadius = size * 0.1;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(offsetX + cornerRadius, offsetY);
  ctx.lineTo(offsetX + drawWidth - cornerRadius, offsetY);
  ctx.arcTo(
    offsetX + drawWidth,
    offsetY,
    offsetX + drawWidth,
    offsetY + cornerRadius,
    cornerRadius
  );
  ctx.lineTo(offsetX + drawWidth, offsetY + drawHeight - cornerRadius);
  ctx.arcTo(
    offsetX + drawWidth,
    offsetY + drawHeight,
    offsetX + drawWidth - cornerRadius,
    offsetY + drawHeight,
    cornerRadius
  );
  ctx.lineTo(offsetX + cornerRadius, offsetY + drawHeight);
  ctx.arcTo(
    offsetX,
    offsetY + drawHeight,
    offsetX,
    offsetY + drawHeight - cornerRadius,
    cornerRadius
  );
  ctx.lineTo(offsetX, offsetY + cornerRadius);
  ctx.arcTo(offsetX, offsetY, offsetX + cornerRadius, offsetY, cornerRadius);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
  return new THREE.CanvasTexture(canvas);
}

// ---- TẠO CÁC NHÓM ĐIỂM HÌNH TRÁI TIM ----
for (let group = 0; group < numGroups; group++) {
  const groupPositions = new Float32Array(pointsPerGroup * 3);
  const groupColorsNear = new Float32Array(pointsPerGroup * 3);
  const groupColorsFar = new Float32Array(pointsPerGroup * 3);
  let validPointCount = 0;

  for (let i = 0; i < pointsPerGroup; i++) {
    const idx = validPointCount * 3;
    const globalIdx = group * pointsPerGroup + i;
    const radius =
      Math.pow(Math.random(), galaxyParameters.randomnessPower) *
      galaxyParameters.radius;
    if (radius < 30) continue;

    const branchAngle =
      ((globalIdx % galaxyParameters.arms) / galaxyParameters.arms) *
      Math.PI *
      2;
    const spinAngle = radius * galaxyParameters.spin;

    const randomX =
      (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const randomY =
      (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
    const randomZ =
      (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const totalAngle = branchAngle + spinAngle;

    groupPositions[idx] = Math.cos(totalAngle) * radius + randomX;
    groupPositions[idx + 1] = randomY;
    groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

    const colorNear = new THREE.Color(0xffffff);
    groupColorsNear[idx] = colorNear.r;
    groupColorsNear[idx + 1] = colorNear.g;
    groupColorsNear[idx + 2] = colorNear.b;

    const colorFar = galaxyParameters.insideColor.clone();
    colorFar.lerp(
      galaxyParameters.outsideColor,
      radius / galaxyParameters.radius
    );
    colorFar.multiplyScalar(0.7 + 0.3 * Math.random());
    groupColorsFar[idx] = colorFar.r;
    groupColorsFar[idx + 1] = colorFar.g;
    groupColorsFar[idx + 2] = colorFar.b;

    validPointCount++;
  }

  if (validPointCount === 0) continue;

  // Geometry cho trạng thái gần camera
  const groupGeometryNear = new THREE.BufferGeometry();
  groupGeometryNear.setAttribute(
    "position",
    new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3)
  );
  groupGeometryNear.setAttribute(
    "color",
    new THREE.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3)
  );

  // Geometry cho trạng thái xa camera
  const groupGeometryFar = new THREE.BufferGeometry();
  groupGeometryFar.setAttribute(
    "position",
    new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3)
  );
  groupGeometryFar.setAttribute(
    "color",
    new THREE.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3)
  );

  // Tính toán tâm của nhóm điểm và dịch chuyển về gốc tọa độ
  const posAttr = groupGeometryFar.getAttribute("position");
  let cx = 0,
    cy = 0,
    cz = 0;
  for (let i = 0; i < posAttr.count; i++) {
    cx += posAttr.getX(i);
    cy += posAttr.getY(i);
    cz += posAttr.getZ(i);
  }
  cx /= posAttr.count;
  cy /= posAttr.count;
  cz /= posAttr.count;
  groupGeometryNear.translate(-cx, -cy, -cz);
  groupGeometryFar.translate(-cx, -cy, -cz);

  // Tải hình ảnh và tạo vật thể
  const img = new window.Image();
  img.crossOrigin = "Anonymous";
  img.src = heartImages[group];
  img.onload = () => {
    const neonTexture = createNeonTexture(img, 256);

    // Material khi ở gần
    const materialNear = new THREE.PointsMaterial({
      size: 1.8,
      map: neonTexture,
      transparent: false,
      alphaTest: 0.2,
      depthWrite: true,
      depthTest: true,
      blending: THREE.NormalBlending,
      vertexColors: true,
    });

    // Material khi ở xa
    const materialFar = new THREE.PointsMaterial({
      size: 1.8,
      map: neonTexture,
      transparent: true,
      alphaTest: 0.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const pointsObject = new THREE.Points(groupGeometryFar, materialFar);
    pointsObject.position.set(cx, cy, cz); // Đặt lại vị trí ban đầu trong scene

    // Lưu trữ các trạng thái để chuyển đổi sau này
    pointsObject.userData.materialNear = materialNear;
    pointsObject.userData.geometryNear = groupGeometryNear;
    pointsObject.userData.materialFar = materialFar;
    pointsObject.userData.geometryFar = groupGeometryFar;

    // Thêm dữ liệu animation cho ảnh bay (chỉ khi camera xa)
    pointsObject.userData.animationData = {
      initialPosition: new THREE.Vector3(cx, cy, cz),
      floatSpeed: Math.random() * 0.02 + 0.01,
      floatAmplitude: Math.random() * 2 + 1,
      rotationSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ),
      pulseSpeed: Math.random() * 0.03 + 0.02,
      initialScale: 1.0,
    };

    scene.add(pointsObject);
    // Thêm một vòng tròn vuông góc với vòng hiện tại, dùng lại geometry và material
    const pointsObject2 = new THREE.Points(
      pointsObject.geometry,
      pointsObject.material
    );
    pointsObject2.position.copy(pointsObject.position);
    pointsObject2.rotation.x = Math.PI / 2;
    pointsObject2.userData = { ...pointsObject.userData };
    scene.add(pointsObject2);
  };
}

// ---- ÁNH SÁNG MÔI TRƯỜNG ----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// ---- TẠO NỀN SAO (STARFIELD) ----
const starCount = 20000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 900;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
  starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
starGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(starPositions, 3)
);

const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.7,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
});
const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = "starfield";
starField.renderOrder = 999;
scene.add(starField);

// ---- TẠO SAO BĂNG (SHOOTING STARS) ----
let shootingStars = [];

function createShootingStar() {
  const trailLength = 100;

  // Đầu sao băng
  const headGeometry = new THREE.SphereGeometry(2, 32, 32);
  const headMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);

  // Hào quang của sao băng
  const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            varying vec3 vNormal;
            uniform float time;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * (0.8 + sin(time * 5.0) * 0.2));
            }
        `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  head.add(glow);

  const atmosphereGeometry = new THREE.SphereGeometry(
    planetRadius * 1.05,
    48,
    48
  );
  const atmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: {
      glowColor: { value: new THREE.Color(0xe0b3ff) },
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        uniform vec3 glowColor;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(glowColor, 1.0) * intensity;
        }
    `,
    side: THREE.BackSide, // Nhìn từ bên trong
    blending: THREE.AdditiveBlending,
    transparent: true,
  });

  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  planet.add(atmosphere); // Thêm khí quyển làm con của hành tinh

  // Đuôi sao băng
  const curve = createRandomCurve();
  const trailPoints = [];
  for (let i = 0; i < trailLength; i++) {
    const progress = i / (trailLength - 1);
    trailPoints.push(curve.getPoint(progress));
  }
  const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
  const trailMaterial = new THREE.LineBasicMaterial({
    color: 0x99eaff,
    transparent: true,
    opacity: 0.7,
    linewidth: 2,
  });
  const trail = new THREE.Line(trailGeometry, trailMaterial);

  const shootingStarGroup = new THREE.Group();
  shootingStarGroup.add(head);
  shootingStarGroup.add(trail);
  shootingStarGroup.userData = {
    curve: curve,
    progress: 0,
    speed: 0.001 + Math.random() * 0.001,
    life: 0,
    maxLife: 300,
    head: head,
    trail: trail,
    trailLength: trailLength,
    trailPoints: trailPoints,
  };
  scene.add(shootingStarGroup);
  shootingStars.push(shootingStarGroup);
}

function createRandomCurve() {
  const points = [];
  const startPoint = new THREE.Vector3(
    -200 + Math.random() * 100,
    -100 + Math.random() * 200,
    -100 + Math.random() * 200
  );
  const endPoint = new THREE.Vector3(
    600 + Math.random() * 200,
    startPoint.y + (-100 + Math.random() * 200),
    startPoint.z + (-100 + Math.random() * 200)
  );
  const controlPoint1 = new THREE.Vector3(
    startPoint.x + 200 + Math.random() * 100,
    startPoint.y + (-50 + Math.random() * 100),
    startPoint.z + (-50 + Math.random() * 100)
  );
  const controlPoint2 = new THREE.Vector3(
    endPoint.x - 200 + Math.random() * 100,
    endPoint.y + (-50 + Math.random() * 100),
    endPoint.z + (-50 + Math.random() * 100)
  );

  points.push(startPoint, controlPoint1, controlPoint2, endPoint);
  return new THREE.CubicBezierCurve3(
    startPoint,
    controlPoint1,
    controlPoint2,
    endPoint
  );
}

// ---- TẠO HỆ THỐNG TRÁI TIM BAY PHẤT PHỚI ----
let floatingHearts = [];

function createHeartTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Tạo SVG path cho trái tim đẹp hơn
  const svgPath = new Path2D(`
    M ${size * 0.5} ${size * 0.35}
    C ${size * 0.2} ${size * 0.1} ${size * 0.1} ${size * 0.6} ${size * 0.5} ${
    size * 0.8
  }
    C ${size * 0.9} ${size * 0.6} ${size * 0.8} ${size * 0.1} ${size * 0.5} ${
    size * 0.35
  }
  `);

  // Gradient đẹp mắt
  const gradient = ctx.createRadialGradient(
    size * 0.5,
    size * 0.4,
    0,
    size * 0.5,
    size * 0.4,
    size * 0.5
  );
  gradient.addColorStop(0, "#ff69b4"); // Hồng sáng
  gradient.addColorStop(0.5, "#ff1493"); // Hồng đậm
  gradient.addColorStop(1, "#c71585"); // Hồng tối

  ctx.fillStyle = gradient;
  ctx.fill(svgPath);

  // Thêm viền sáng
  ctx.strokeStyle = "#ffb6c1";
  ctx.lineWidth = 3;
  ctx.stroke(svgPath);

  // Thêm hiệu ứng glow
  ctx.shadowColor = "#ff69b4";
  ctx.shadowBlur = 15;
  ctx.fill(svgPath);

  return new THREE.CanvasTexture(canvas);
}

function createFloatingHeart() {
  const heartTexture = createHeartTexture();
  const heartMaterial = new THREE.SpriteMaterial({
    map: heartTexture,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  const heart = new THREE.Sprite(heartMaterial);

  // Vị trí ngẫu nhiên (không gian rất rộng)
  heart.position.set(
    (Math.random() - 0.5) * 800,
    (Math.random() - 0.5) * 800,
    (Math.random() - 0.5) * 800
  );

  // Kích thước to hơn nữa
  const scale = 4.0 + Math.random() * 4.0; // Từ 4x đến 8x
  heart.scale.set(scale, scale, scale);

  // Dữ liệu animation (chậm hơn và mượt hơn)
  heart.userData = {
    speed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.2, // Chậm hơn
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    ),
    rotationSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.01, // Xoay chậm hơn
      (Math.random() - 0.5) * 0.01,
      (Math.random() - 0.5) * 0.01
    ),
    floatSpeed: Math.random() * 0.01 + 0.005, // Nổi chậm hơn
    floatAmplitude: Math.random() * 0.3 + 0.2,
    pulseSpeed: Math.random() * 0.015 + 0.01, // Pulse chậm hơn
    initialScale: scale,
    life: 0,
    maxLife: 2000 + Math.random() * 3000, // Sống lâu hơn
  };

  scene.add(heart);
  floatingHearts.push(heart);
}

function animateFloatingHearts(time) {
  for (let i = floatingHearts.length - 1; i >= 0; i--) {
    const heart = floatingHearts[i];
    const userData = heart.userData;

    userData.life++;

    // Xóa trái tim cũ
    if (userData.life > userData.maxLife) {
      scene.remove(heart);
      floatingHearts.splice(i, 1);
      continue;
    }

    // Di chuyển
    heart.position.add(userData.speed);

    // Xoay
    heart.rotation.x += userData.rotationSpeed.x;
    heart.rotation.y += userData.rotationSpeed.y;
    heart.rotation.z += userData.rotationSpeed.z;

    // Hiệu ứng nổi lên xuống
    const floatOffset =
      Math.sin(time * userData.floatSpeed) * userData.floatAmplitude;
    heart.position.y += floatOffset * 0.01;

    // Hiệu ứng pulse (phóng to thu nhỏ)
    const pulse = Math.sin(time * userData.pulseSpeed) * 0.2 + 1;
    heart.scale.setScalar(userData.initialScale * pulse);

    // Hiệu ứng fade out khi gần hết đời sống
    if (userData.life > userData.maxLife * 0.8) {
      const fadeOut =
        1 - (userData.life - userData.maxLife * 0.8) / (userData.maxLife * 0.2);
      heart.material.opacity = fadeOut;
    }

    // Giới hạn không gian bay (rất rộng cho thật nhiều trái tim)
    if (Math.abs(heart.position.x) > 400) userData.speed.x *= -1;
    if (Math.abs(heart.position.y) > 400) userData.speed.y *= -1;
    if (Math.abs(heart.position.z) > 400) userData.speed.z *= -1;
  }

  // Tạo trái tim mới (thật nhiều)
  if (floatingHearts.length < 2000 && Math.random() < 0.1) {
    createFloatingHeart();
  }
}

// Tạo một số trái tim ban đầu (thật nhiều)
for (let i = 0; i < 1200; i++) {
  createFloatingHeart();
}

// ---- TẠO TÀU BAY VÀ NGƯỜI NGOÀI HÀNH TINH ----
let spaceships = [];
let aliens = [];

function createSpaceship() {
  const shipGroup = new THREE.Group();

  // Thân tàu (hình trụ)
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 1, 3, 8);
  const bodyMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.8,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.rotation.z = Math.PI / 2;
  shipGroup.add(body);

  // Cánh tàu
  const wingGeometry = new THREE.BoxGeometry(4, 0.1, 1);
  const wingMaterial = new THREE.MeshBasicMaterial({
    color: 0x00cc66,
    transparent: true,
    opacity: 0.7,
  });
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.x = -1.5;
  rightWing.position.x = 1.5;
  shipGroup.add(leftWing, rightWing);

  // Động cơ phát sáng
  const engineGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const engineMaterial = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    transparent: true,
    opacity: 0.9,
  });
  const leftEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  const rightEngine = new THREE.Mesh(engineGeometry, engineMaterial);
  leftEngine.position.set(-1.5, 0, -1.5);
  rightEngine.position.set(1.5, 0, -1.5);
  shipGroup.add(leftEngine, rightEngine);

  // Vị trí ngẫu nhiên
  shipGroup.position.set(
    (Math.random() - 0.5) * 600,
    (Math.random() - 0.5) * 600,
    (Math.random() - 0.5) * 600
  );

  // Dữ liệu animation
  shipGroup.userData = {
    speed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3
    ),
    rotationSpeed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02,
      (Math.random() - 0.5) * 0.02
    ),
    engineGlow: 0,
  };

  scene.add(shipGroup);
  spaceships.push(shipGroup);
}

function createAlien() {
  const alienGroup = new THREE.Group();

  // Đầu người ngoài hành tinh (hình tròn to)
  const headGeometry = new THREE.SphereGeometry(1.2, 12, 12);
  const headMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffaa,
    transparent: true,
    opacity: 0.8,
  });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  alienGroup.add(head);

  // Mắt to
  const eyeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.9,
  });
  const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
  leftEye.position.set(-0.4, 0.3, 0.8);
  rightEye.position.set(0.4, 0.3, 0.8);
  alienGroup.add(leftEye, rightEye);

  // Thân (hình trụ nhỏ)
  const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8);
  const bodyMaterial = new THREE.MeshBasicMaterial({
    color: 0x00dd88,
    transparent: true,
    opacity: 0.7,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = -1.5;
  alienGroup.add(body);

  // Tay
  const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 6);
  const armMaterial = new THREE.MeshBasicMaterial({
    color: 0x00dd88,
    transparent: true,
    opacity: 0.7,
  });
  const leftArm = new THREE.Mesh(armGeometry, armMaterial);
  const rightArm = new THREE.Mesh(armGeometry, armMaterial);
  leftArm.position.set(-0.8, -1, 0);
  rightArm.position.set(0.8, -1, 0);
  leftArm.rotation.z = Math.PI / 4;
  rightArm.rotation.z = -Math.PI / 4;
  alienGroup.add(leftArm, rightArm);

  // Vị trí ngẫu nhiên
  alienGroup.position.set(
    (Math.random() - 0.5) * 500,
    (Math.random() - 0.5) * 500,
    (Math.random() - 0.5) * 500
  );

  // Dữ liệu animation
  alienGroup.userData = {
    speed: new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    ),
    floatSpeed: Math.random() * 0.01 + 0.005,
    floatAmplitude: Math.random() * 1 + 0.5,
    waveSpeed: Math.random() * 0.02 + 0.01,
  };

  scene.add(alienGroup);
  aliens.push(alienGroup);
}

function animateSpaceshipsAndAliens(time) {
  // Animate tàu bay
  spaceships.forEach((ship) => {
    const userData = ship.userData;

    // Di chuyển
    ship.position.add(userData.speed);

    // Xoay
    ship.rotation.x += userData.rotationSpeed.x;
    ship.rotation.y += userData.rotationSpeed.y;
    ship.rotation.z += userData.rotationSpeed.z;

    // Hiệu ứng động cơ phát sáng
    userData.engineGlow = Math.sin(time * 10) * 0.3 + 0.7;
    ship.children.forEach((child) => {
      if (child.material && child.material.color.getHex() === 0xff6600) {
        child.material.opacity = userData.engineGlow;
      }
    });

    // Giới hạn không gian bay
    if (Math.abs(ship.position.x) > 300) userData.speed.x *= -1;
    if (Math.abs(ship.position.y) > 300) userData.speed.y *= -1;
    if (Math.abs(ship.position.z) > 300) userData.speed.z *= -1;
  });

  // Animate người ngoài hành tinh
  aliens.forEach((alien) => {
    const userData = alien.userData;

    // Di chuyển
    alien.position.add(userData.speed);

    // Hiệu ứng nổi lên xuống
    const floatOffset =
      Math.sin(time * userData.floatSpeed) * userData.floatAmplitude;
    alien.position.y += floatOffset * 0.01;

    // Hiệu ứng vẫy tay
    const leftArm = alien.children[3]; // Tay trái
    const rightArm = alien.children[4]; // Tay phải
    if (leftArm && rightArm) {
      leftArm.rotation.z =
        Math.PI / 4 + Math.sin(time * userData.waveSpeed) * 0.3;
      rightArm.rotation.z =
        -Math.PI / 4 + Math.sin(time * userData.waveSpeed + Math.PI) * 0.3;
    }

    // Giới hạn không gian bay
    if (Math.abs(alien.position.x) > 250) userData.speed.x *= -1;
    if (Math.abs(alien.position.y) > 250) userData.speed.y *= -1;
    if (Math.abs(alien.position.z) > 250) userData.speed.z *= -1;
  });

  // Tạo thêm tàu bay và người ngoài hành tinh
  if (spaceships.length < 8 && Math.random() < 0.005) {
    createSpaceship();
  }

  if (aliens.length < 6 && Math.random() < 0.003) {
    createAlien();
  }
}

// Tạo một số tàu bay và người ngoài hành tinh ban đầu
for (let i = 0; i < 4; i++) {
  createSpaceship();
}

for (let i = 0; i < 3; i++) {
  createAlien();
}

// ---- ANIMATE ẢNH BAY (CHỈ KHI CAMERA XA) ----
function animateImages(time) {
  const cameraDistance = camera.position.length();
  const shouldAnimate = cameraDistance > 80; // Chỉ animate khi camera xa hơn 80 đơn vị

  scene.traverse((obj) => {
    if (obj.isPoints && obj.userData.animationData) {
      const animData = obj.userData.animationData;

      if (shouldAnimate) {
        // Hiệu ứng nổi lên xuống
        const floatOffset =
          Math.sin(time * animData.floatSpeed) * animData.floatAmplitude;
        obj.position.y = animData.initialPosition.y + floatOffset;

        // Hiệu ứng xoay
        obj.rotation.x += animData.rotationSpeed.x;
        obj.rotation.y += animData.rotationSpeed.y;
        obj.rotation.z += animData.rotationSpeed.z;

        // Hiệu ứng pulse (phóng to thu nhỏ)
        const pulse = Math.sin(time * animData.pulseSpeed) * 0.2 + 1;
        obj.scale.setScalar(animData.initialScale * pulse);
      } else {
        // Khi camera gần, trở về vị trí ban đầu
        obj.position.copy(animData.initialPosition);
        obj.rotation.set(0, 0, 0);
        obj.scale.setScalar(animData.initialScale);
      }
    }
  });
}

// ---- TẠO HÀNH TINH TRUNG TÂM ----

// Hàm tạo texture cho hành tinh
function createPlanetTexture(size = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");

  // Nền gradient
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size / 8,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0.0, "#f8bbd0");
  gradient.addColorStop(0.12, "#f48fb1");
  gradient.addColorStop(0.22, "#f06292");
  gradient.addColorStop(0.35, "#ffffff");
  gradient.addColorStop(0.5, "#e1aaff");
  gradient.addColorStop(0.62, "#a259f7");
  gradient.addColorStop(0.75, "#b2ff59");
  gradient.addColorStop(1.0, "#3fd8c7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Các đốm màu ngẫu nhiên
  const spotColors = [
    "#f8bbd0",
    "#f8bbd0",
    "#f48fb1",
    "#f48fb1",
    "#f06292",
    "#f06292",
    "#ffffff",
    "#e1aaff",
    "#a259f7",
    "#b2ff59",
  ];
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = 30 + Math.random() * 120;
    const color = spotColors[Math.floor(Math.random() * spotColors.length)];
    const spotGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    spotGradient.addColorStop(0, color + "cc"); // 'cc' là alpha
    spotGradient.addColorStop(1, color + "00");
    ctx.fillStyle = spotGradient;
    ctx.fillRect(0, 0, size, size);
  }

  // Các đường cong (swirls)
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * size, Math.random() * size);
    ctx.bezierCurveTo(
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size,
      Math.random() * size
    );
    ctx.strokeStyle =
      "rgba(180, 120, 200, " + (0.12 + Math.random() * 0.18) + ")";
    ctx.lineWidth = 8 + Math.random() * 18;
    ctx.stroke();
  }

  // Áp dụng blur
  if (ctx.filter !== undefined) {
    ctx.filter = "blur(2px)";
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = "none";
  }

  return new THREE.CanvasTexture(canvas);
}

// Shader cho hiệu ứng bão trên bề mặt hành tinh
const stormShader = {
  uniforms: {
    time: { value: 0.0 },
    baseTexture: { value: null },
  },
  vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
  fragmentShader: `
        uniform float time;
        uniform sampler2D baseTexture;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            float angle = length(uv - vec2(0.5)) * 3.0;
            float twist = sin(angle * 3.0 + time) * 0.1;
            uv.x += twist * sin(time * 0.5);
            uv.y += twist * cos(time * 0.5);
            vec4 texColor = texture2D(baseTexture, uv);
            float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;
            texColor.rgb += noise * vec3(0.8, 0.4, 0.2);
            gl_FragColor = texColor;
        }
    `,
};

// Tạo vật thể hành tinh
const planetRadius = 10;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 48, 48);
const planetTexture = createPlanetTexture();
const planetMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    baseTexture: { value: planetTexture },
  },
  vertexShader: stormShader.vertexShader,
  fragmentShader: stormShader.fragmentShader,
});
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
scene.add(planet);

// ---- TẠO CÁC VÒNG CHỮ QUAY QUANH HÀNH TINH ----
const ringTexts = [
  "EM NGÀ XYNH GÁI 😒😒😒",
  ...(window.dataLove2Loveloom && window.dataLove2Loveloom.data.ringTexts
    ? window.dataLove2Loveloom.data.ringTexts
    : []),
];

function createTextRings() {
  const numRings = ringTexts.length;
  const baseRingRadius = planetRadius * 1.1;
  const ringSpacing = 5;
  window.textRings = [];

  for (let i = 0; i < numRings; i++) {
    const text = ringTexts[i % ringTexts.length] + "   "; // Thêm khoảng trắng
    const ringRadius = baseRingRadius + i * ringSpacing;

    // ---- Logic phân tích và điều chỉnh kích thước font chữ (được giữ nguyên) ----
    function getCharType(char) {
      const charCode = char.charCodeAt(0);
      if (
        (charCode >= 0x4e00 && charCode <= 0x9fff) || // CJK
        (charCode >= 0x3040 && charCode <= 0x309f) || // Hiragana
        (charCode >= 0x30a0 && charCode <= 0x30ff) || // Katakana
        (charCode >= 0xac00 && charCode <= 0xd7af)
      ) {
        // Korean
        return "cjk";
      } else if (charCode >= 0 && charCode <= 0x7f) {
        // Latin
        return "latin";
      }
      return "other";
    }

    let charCounts = { cjk: 0, latin: 0, other: 0 };
    for (let char of text) {
      charCounts[getCharType(char)]++;
    }

    const totalChars = text.length;
    const cjkRatio = charCounts.cjk / totalChars;

    let scaleParams = { fontScale: 0.75, spacingScale: 1.1 };

    if (i === 0) {
      scaleParams.fontScale = 0.55;
      scaleParams.spacingScale = 0.9;
    } else if (i === 1) {
      scaleParams.fontScale = 0.65;
      scaleParams.spacingScale = 1.0;
    }

    if (cjkRatio > 0) {
      scaleParams.fontScale *= 0.9;
      scaleParams.spacingScale *= 1.1;
    }
    // ---- Kết thúc logic phân tích font ----

    // ---- Tạo texture chữ động ----
    const textureHeight = 280; // Tăng từ 200 lên 280
    const fontSize = Math.max(160, 0.9 * textureHeight); // Tăng từ 120 lên 160

    // Đo chiều rộng của text để lặp lại
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.font = `900 ${fontSize}px Arial, sans-serif`; // Đồng bộ font weight
    let singleText = ringTexts[i % ringTexts.length];
    const separator = "   ";
    let repeatedTextSegment = singleText + separator;

    let segmentWidth = tempCtx.measureText(repeatedTextSegment).width;
    let textureWidthCircumference = 2 * Math.PI * ringRadius * 180; // Heuristic value
    let repeatCount = Math.ceil(textureWidthCircumference / segmentWidth);

    let fullText = "";
    for (let j = 0; j < repeatCount; j++) {
      fullText += repeatedTextSegment;
    }

    let finalTextureWidth = segmentWidth * repeatCount;
    if (finalTextureWidth < 1 || !fullText) {
      fullText = repeatedTextSegment;
      finalTextureWidth = segmentWidth;
    }

    // Vẽ text lên canvas chính
    const textCanvas = document.createElement("canvas");
    textCanvas.width = Math.ceil(Math.max(1, finalTextureWidth));
    textCanvas.height = textureHeight;
    const ctx = textCanvas.getContext("2d");

    ctx.clearRect(0, 0, textCanvas.width, textureHeight);
    ctx.font = `900 ${fontSize}px Arial, sans-serif`; // Tăng font weight từ bold thành 900
    ctx.fillStyle = "#007e11"; // Đổi màu chữ thành vàng gold dễ nhìn
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Hiệu ứng glow cho chữ - màu vàng cam
    ctx.shadowColor = "#FFA500"; // Màu cam
    ctx.shadowBlur = 30;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#FF8C00"; // Màu cam đậm
    ctx.strokeText(fullText, 0, textureHeight * 0.8);

    ctx.shadowColor = "#007e11"; // Màu vàng gold
    ctx.shadowBlur = 20;
    ctx.fillText(fullText, 0, textureHeight * 0.8);

    const ringTexture = new THREE.CanvasTexture(textCanvas);
    ringTexture.wrapS = THREE.RepeatWrapping;
    ringTexture.repeat.x = finalTextureWidth / textureWidthCircumference;
    ringTexture.needsUpdate = true;

    const ringGeometry = new THREE.CylinderGeometry(
      ringRadius,
      ringRadius,
      1,
      128,
      1,
      true
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.01,
    });

    const textRingMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    textRingMesh.position.set(0, 0, 0);
    textRingMesh.rotation.y = Math.PI / 2;

    const ringGroup = new THREE.Group();
    ringGroup.add(textRingMesh);
    ringGroup.userData = {
      ringRadius: ringRadius,
      angleOffset: 0.15 * Math.PI * 0.5,
      speed: 0.003, // Giảm tốc độ quay từ 0.008 xuống 0.003 để dễ đọc hơn
      tiltSpeed: 0,
      rollSpeed: 0,
      pitchSpeed: 0, // Tốc độ lắc
      tiltAmplitude: Math.PI / 3,
      rollAmplitude: Math.PI / 6,
      pitchAmplitude: Math.PI / 8, // Biên độ lắc
      tiltPhase: Math.PI * 2,
      rollPhase: Math.PI * 2,
      pitchPhase: Math.PI * 2, // Pha lắc
      isTextRing: true,
    };

    const initialRotationX = (i / numRings) * (Math.PI / 1);
    ringGroup.rotation.x = initialRotationX;
    scene.add(ringGroup);
    window.textRings.push(ringGroup);
  }
}

createTextRings();

function updateTextRingsRotation() {
  if (!window.textRings || !camera) return;

  window.textRings.forEach((ringGroup, index) => {
    ringGroup.children.forEach((child) => {
      if (child.userData.initialAngle !== undefined) {
        const angle =
          child.userData.initialAngle + ringGroup.userData.angleOffset;
        const x = Math.cos(angle) * child.userData.ringRadius;
        const z = Math.sin(angle) * child.userData.ringRadius;
        child.position.set(x, 0, z);

        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);

        const lookAtVector = new THREE.Vector3()
          .subVectors(camera.position, worldPos)
          .normalize();
        const rotationY = Math.atan2(lookAtVector.x, lookAtVector.z);
        child.rotation.y = rotationY;
      }
    });
  });
}

function animatePlanetSystem() {
  if (window.textRings) {
    const time = Date.now() * 0.001;
    window.textRings.forEach((ringGroup, index) => {
      const userData = ringGroup.userData;
      userData.angleOffset += userData.speed;

      // Chuyển động lắc lư
      const tilt =
        Math.sin(time * userData.tiltSpeed + userData.tiltPhase) *
        userData.tiltAmplitude;
      const roll =
        Math.cos(time * userData.rollSpeed + userData.rollPhase) *
        userData.rollAmplitude;
      const pitch =
        Math.sin(time * userData.pitchSpeed + userData.pitchPhase) *
        userData.pitchAmplitude;

      ringGroup.rotation.x =
        (index / window.textRings.length) * (Math.PI / 1) + tilt;
      ringGroup.rotation.z = roll;
      ringGroup.rotation.y = userData.angleOffset + pitch;

      const verticalBob =
        Math.sin(time * (userData.tiltSpeed * 0.7) + userData.tiltPhase) * 0.3;
      ringGroup.position.y = verticalBob;

      const pulse = (Math.sin(time * 1.5 + index) + 1) / 2; // giá trị từ 0 đến 1
      const textMesh = ringGroup.children[0];
      if (textMesh && textMesh.material) {
        // Thay đổi độ mờ từ 0.7 đến 1.0
        textMesh.material.opacity = 0.7 + pulse * 0.3;
      }
    });
    updateTextRingsRotation();
  }
}

// ---- VÒNG LẶP ANIMATE ----
let fadeOpacity = 0.1;
let fadeInProgress = false;

// =======================================================================
// ---- THÊM HIỆU ỨNG GỢI Ý NHẤN VÀO TINH CẦU (HINT ICON) ----
// =======================================================================

let hintIcon;
let hintText;
/**
 * Tạo icon con trỏ chuột 3D để gợi ý người dùng.
 * PHIÊN BẢN HOÀN CHỈNH: Con trỏ màu trắng đồng nhất và được đặt ở vị trí
 * xa hơn so với quả cầu trung tâm.
 */
function createHintIcon() {
  hintIcon = new THREE.Group();
  hintIcon.name = "hint-icon-group";
  scene.add(hintIcon);

  const cursorVisuals = new THREE.Group();

  // --- 1. TẠO HÌNH DẠNG CON TRỎ (Giữ nguyên) ---
  const cursorShape = new THREE.Shape();
  const h = 1.5;
  const w = h * 0.5;

  cursorShape.moveTo(0, 0);
  cursorShape.lineTo(-w * 0.4, -h * 0.7);
  cursorShape.lineTo(-w * 0.25, -h * 0.7);
  cursorShape.lineTo(-w * 0.5, -h);
  cursorShape.lineTo(w * 0.5, -h);
  cursorShape.lineTo(w * 0.25, -h * 0.7);
  cursorShape.lineTo(w * 0.4, -h * 0.7);
  cursorShape.closePath();

  // --- 2. TẠO CON TRỎ MÀU TRẮNG ---

  // Lớp nền (trước là viền đen, giờ là nền trắng)
  const backgroundGeometry = new THREE.ShapeGeometry(cursorShape);
  const backgroundMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, // THAY ĐỔI: Chuyển viền thành màu trắng
    side: THREE.DoubleSide,
  });
  const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);

  // Lớp trắng bên trong (giờ không cần thiết nhưng giữ lại để đảm bảo độ dày)
  const foregroundGeometry = new THREE.ShapeGeometry(cursorShape);
  const foregroundMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff, // Giữ màu trắng
    side: THREE.DoubleSide,
  });
  const foregroundMesh = new THREE.Mesh(foregroundGeometry, foregroundMaterial);

  foregroundMesh.scale.set(0.8, 0.8, 1);
  foregroundMesh.position.z = 0.01;

  cursorVisuals.add(backgroundMesh, foregroundMesh);
  cursorVisuals.position.y = h / 2;
  cursorVisuals.rotation.x = Math.PI / 2;

  // --- 3. TẠO VÒNG TRÒN BAO QUANH (Giữ nguyên) ---
  const ringGeometry = new THREE.RingGeometry(1.8, 2.0, 32);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  });
  const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  ringMesh.rotation.x = Math.PI / 2;
  hintIcon.userData.ringMesh = ringMesh;

  // --- 4. HOÀN THIỆN ICON ---
  hintIcon.add(cursorVisuals);
  hintIcon.add(ringMesh);

  // THAY ĐỔI: Đặt icon ở vị trí xa hơn
  hintIcon.position.set(1.5, 1.5, 15); // Tăng giá trị Z từ 12 lên 20

  hintIcon.scale.set(0.8, 0.8, 0.8);
  hintIcon.lookAt(planet.position);
  hintIcon.userData.initialPosition = hintIcon.position.clone();
}

/**
 * Animate icon gợi ý.
 * @param {number} time - Thời gian hiện tại.
 */
function animateHintIcon(time) {
  if (!hintIcon) return;

  if (!introStarted) {
    hintIcon.visible = true;

    // Hiệu ứng "nhấn" tới lui
    const tapFrequency = 2.5;
    const tapAmplitude = 1.5;
    const tapOffset = Math.sin(time * tapFrequency) * tapAmplitude;

    // Di chuyển icon tới lui theo hướng nó đang nhìn
    const direction = new THREE.Vector3();
    hintIcon.getWorldDirection(direction);
    hintIcon.position
      .copy(hintIcon.userData.initialPosition)
      .addScaledVector(direction, -tapOffset);

    // Hiệu ứng "sóng" cho vòng tròn
    const ring = hintIcon.userData.ringMesh;
    const ringScale = 1 + Math.sin(time * tapFrequency) * 0.1;
    ring.scale.set(ringScale, ringScale, 1);
    ring.material.opacity = 0.5 + Math.sin(time * tapFrequency) * 0.2;
    // Xử lý văn bản gợi ý (thêm hiệu ứng mới)
    if (hintText) {
      hintText.visible = true;
      hintText.material.opacity = 0.7 + Math.sin(time * 3) * 0.3;
      hintText.position.y = 15 + Math.sin(time * 2) * 0.5;
      hintText.lookAt(camera.position);
    }
  } else {
    // Ẩn icon đi khi intro đã bắt đầu
    if (hintIcon) hintIcon.visible = false;

    if (hintText) hintText.visible = false;
  }
}

// ---- CHỈNH SỬA VÒNG LẶP ANIMATE ----
// Bạn cần thay thế hàm animate() cũ bằng hàm đã được chỉnh sửa này.
function animate() {
  requestAnimationFrame(animate);
  const time = performance.now() * 0.001;

  // Cập nhật icon gợi ý
  animateHintIcon(time);

  // Cập nhật trái tim bay phất phới
  animateFloatingHearts(time);

  // Cập nhật ảnh bay (chỉ khi camera xa)
  animateImages(time);

  // Cập nhật tàu bay và người ngoài hành tinh
  animateSpaceshipsAndAliens(time);

  // Cập nhật hiệu ứng sinh nhật
  animateBirthdayEffects(time);

  // Cập nhật hộp quà
  animateGiftBoxes(time);

  controls.update();
  planet.material.uniforms.time.value = time * 0.5;

  // Logic fade-in sau khi bắt đầu
  if (fadeInProgress && fadeOpacity < 1) {
    fadeOpacity += 0.025;
    if (fadeOpacity > 1) fadeOpacity = 1;
  }

  if (!introStarted) {
    // Trạng thái trước khi intro bắt đầu
    fadeOpacity = 0.1;
    scene.traverse((obj) => {
      if (obj.name === "starfield") {
        if (obj.points && obj.material.opacity !== undefined) {
          obj.material.transparent = false;
          obj.material.opacity = 1;
        }
        return;
      }
      if (
        obj.userData.isTextRing ||
        (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing)
      ) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = false;
          obj.material.opacity = 1;
        }
        if (obj.material && obj.material.color) {
          obj.material.color.set(0xffffff);
        }
      } else if (
        obj !== planet &&
        obj !== centralGlow &&
        obj !== hintIcon &&
        obj.type !== "Scene" &&
        !obj.parent.isGroup
      ) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = true;
          obj.material.opacity = 0.1;
        }
      }
    });
    planet.visible = true;
    centralGlow.visible = true;
  } else {
    // Trạng thái sau khi intro bắt đầu
    scene.traverse((obj) => {
      if (
        !(
          obj.userData.isTextRing ||
          (obj.parent &&
            obj.parent.userData &&
            obj.parent.userData.isTextRing) ||
          obj === planet ||
          obj === centralGlow ||
          obj.type === "Scene"
        )
      ) {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.transparent = true;
          obj.material.opacity = fadeOpacity;
        }
      } else {
        if (obj.material && obj.material.opacity !== undefined) {
          obj.material.opacity = 1;
          obj.material.transparent = false;
        }
      }
      if (obj.material && obj.material.color) {
        obj.material.color.set(0xffffff);
      }
    });
  }

  // Cập nhật sao băng
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];
    star.userData.life++;

    let opacity = 1.0;
    if (star.userData.life < 30) {
      opacity = star.userData.life / 30;
    } else if (star.userData.life > star.userData.maxLife - 30) {
      opacity = (star.userData.maxLife - star.userData.life) / 30;
    }

    star.userData.progress += star.userData.speed;
    if (star.userData.progress > 1) {
      scene.remove(star);
      shootingStars.splice(i, 1);
      continue;
    }

    const currentPos = star.userData.curve.getPoint(star.userData.progress);
    star.position.copy(currentPos);
    star.userData.head.material.opacity = opacity;
    star.userData.head.children[0].material.uniforms.time.value = time;

    const trail = star.userData.trail;
    const trailPoints = star.userData.trailPoints;
    trailPoints[0].copy(currentPos);
    for (let j = 1; j < star.userData.trailLength; j++) {
      const trailProgress = Math.max(0, star.userData.progress - j * 0.01);
      trailPoints[j].copy(star.userData.curve.getPoint(trailProgress));
    }
    trail.geometry.setFromPoints(trailPoints);
    trail.material.opacity = opacity * 0.7;
  }

  if (shootingStars.length < 3 && Math.random() < 0.02) {
    createShootingStar();
  }

  // Tạo thêm hiệu ứng sinh nhật liên tục
  if (isRoomOut) {
    if (Math.random() < 0.015) {
      // Giảm từ 0.08 xuống 0.015
      birthdayEffects.push(createFirework());
    }

    if (Math.random() < 0.01) {
      // Giảm từ 0.06 xuống 0.01
      birthdayEffects.push(createConfetti());
    }

    if (Math.random() < 0.008) {
      // Giảm từ 0.05 xuống 0.008
      birthdayEffects.push(createSparkles());
    }

    if (Math.random() < 0.03) {
      // Tăng từ 0.005 lên 0.03 (tăng 6 lần)
      birthdayEffects.push(createBirthdayText());
    }
  } else {
    // Tạo hiệu ứng ngay cả khi chưa room out (với tần suất thấp hơn)
    if (Math.random() < 0.005) {
      // Giảm từ 0.02 xuống 0.005
      birthdayEffects.push(createFirework());
    }

    if (Math.random() < 0.003) {
      // Giảm từ 0.015 xuống 0.003
      birthdayEffects.push(createConfetti());
    }

    if (Math.random() < 0.002) {
      // Giảm từ 0.01 xuống 0.002
      birthdayEffects.push(createSparkles());
    }

    if (Math.random() < 0.02) {
      // Tăng từ 0.001 lên 0.02 (tăng 20 lần)
      birthdayEffects.push(createBirthdayText());
    }
  }

  // Logic chuyển đổi material cho các nhóm điểm trái tim
  scene.traverse((obj) => {
    if (obj.isPoints && obj.userData.materialNear && obj.userData.materialFar) {
      const positionAttr = obj.geometry.getAttribute("position");
      let isClose = false;
      for (let i = 0; i < positionAttr.count; i++) {
        const worldX = positionAttr.getX(i) + obj.position.x;
        const worldY = positionAttr.getY(i) + obj.position.y;
        const worldZ = positionAttr.getZ(i) + obj.position.z;
        const distance = camera.position.distanceTo(
          new THREE.Vector3(worldX, worldY, worldZ)
        );
        if (distance < 10) {
          isClose = true;
          break;
        }
      }
      if (isClose) {
        if (obj.material !== obj.userData.materialNear) {
          obj.material = obj.userData.materialNear;
          obj.geometry = obj.userData.geometryNear;
        }
      } else {
        if (obj.material !== obj.userData.materialFar) {
          obj.material = obj.userData.materialFar;
          obj.geometry = obj.userData.geometryFar;
        }
      }
    }
  });

  planet.lookAt(camera.position);
  animatePlanetSystem();

  if (
    starField &&
    starField.material &&
    starField.material.opacity !== undefined
  ) {
    starField.material.opacity = 1.0;
    starField.material.transparent = false;
  }

  renderer.render(scene, camera);
}
function createHintText() {
  const canvasSize = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = canvasSize;
  const context = canvas.getContext("2d");
  const fontSize = 50;
  const text = "Chạm Vào Tinh Cầu";
  context.font = `bold ${fontSize}px Arial, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "#ffb3de";
  context.shadowBlur = 5;
  context.lineWidth = 2;
  context.strokeStyle = "rgba(255, 200, 220, 0.8)";
  context.strokeText(text, canvasSize / 2, canvasSize / 2);
  context.shadowColor = "#e0b3ff";
  context.shadowBlur = 5;
  context.lineWidth = 2;
  context.strokeStyle = "rgba(220, 180, 255, 0.5)";
  context.strokeText(text, canvasSize / 2, canvasSize / 2);
  context.shadowColor = "transparent";
  context.shadowBlur = 0;
  context.fillStyle = "white";
  context.fillText(text, canvasSize / 2, canvasSize / 2);
  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.needsUpdate = true;
  const textMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const planeGeometry = new THREE.PlaneGeometry(16, 8);
  hintText = new THREE.Mesh(planeGeometry, textMaterial);
  hintText.position.set(0, 15, 0);
  scene.add(hintText);
}

// ---- CÁC HÀM XỬ LÝ SỰ KIỆN VÀ KHỞI ĐỘNG ----
createShootingStar();
createHintIcon(); // Gọi hàm tạo icon
createHintText();
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  controls.target.set(0, 0, 0);
  controls.update();
});

function startCameraAnimation() {
  const startPos = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };
  const midPos1 = { x: startPos.x, y: 0, z: startPos.z };
  const midPos2 = { x: startPos.x, y: 0, z: 160 };
  const endPos = { x: -40, y: 100, z: 100 };

  const duration1 = 0.4; // Tăng từ 0.2 lên 0.4 (chậm hơn)
  const duration2 = 0.8; // Tăng từ 0.55 lên 0.8 (chậm hơn)
  const duration3 = 0.6; // Tăng từ 0.4 lên 0.6 (chậm hơn)
  let progress = 0;

  function animatePath() {
    progress += 0.0008; // Giảm từ 0.00101 xuống 0.0008 (chậm hơn)
    let newPos;

    if (progress < duration1) {
      let t = progress / duration1;
      newPos = {
        x: startPos.x + (midPos1.x - startPos.x) * t,
        y: startPos.y + (midPos1.y - startPos.y) * t,
        z: startPos.z + (midPos1.z - startPos.z) * t,
      };
    } else if (progress < duration1 + duration2) {
      let t = (progress - duration1) / duration2;
      newPos = {
        x: midPos1.x + (midPos2.x - midPos1.x) * t,
        y: midPos1.y + (midPos2.y - midPos1.y) * t,
        z: midPos1.z + (midPos2.z - midPos1.z) * t,
      };
      console.log(startPos);
    } else if (progress < duration1 + duration2 + duration3) {
      let t = (progress - duration1 - duration2) / duration3;
      let easedT = 0.5 - 0.5 * Math.cos(Math.PI * t); // Ease-in-out
      newPos = {
        x: midPos2.x + (endPos.x - midPos2.x) * easedT,
        y: midPos2.y + (endPos.y - midPos2.y) * easedT,
        z: midPos2.z + (endPos.z - midPos2.z) * easedT,
      };
    } else {
      camera.position.set(endPos.x, endPos.y, endPos.z);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
      // Sau khi room vào xong, gọi room ra

      startCameraRoomOut(endPos);
      return;
    }

    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(0, 0, 0);
    requestAnimationFrame(animatePath);
  }
  controls.enabled = false;

  animatePath();
}

// Tạo hiệu ứng pháo hoa
function createFirework() {
  const firework = new THREE.Group();
  const particleCount = 25; // Giảm từ 50 xuống 25
  const particles = [];

  // Vị trí ngẫu nhiên cho pháo hoa
  const fireworkX = (Math.random() - 0.5) * 200;
  const fireworkY = Math.random() * 100 + 50;
  const fireworkZ = (Math.random() - 0.5) * 200;

  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
      transparent: true,
      opacity: 1,
    });
    const particle = new THREE.Mesh(geometry, material);

    // Vị trí ngẫu nhiên xung quanh điểm pháo hoa
    particle.position.set(
      fireworkX + (Math.random() - 0.5) * 50,
      fireworkY + (Math.random() - 0.5) * 50,
      fireworkZ + (Math.random() - 0.5) * 50
    );

    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        (Math.random() - 0.5) * 2
      ),
      life: 0,
      maxLife: 120,
      originalColor: material.color.clone(),
    };

    particles.push(particle);
    firework.add(particle);
  }

  firework.userData = { particles, life: 0, maxLife: 300 }; // Tăng từ 120 lên 300
  scene.add(firework);
  return firework;
}

// Tạo chữ "HAPPY BIRTHDAY" bay lên
function createBirthdayText() {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = "bold 42px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Gradient text
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#ff6b9d");
  gradient.addColorStop(0.5, "#ffd93d");
  gradient.addColorStop(1, "#6bcf7f");

  ctx.fillStyle = gradient;
  ctx.fillText("🎁🎁HAPPY BIRTHDAY!🎆🎆", canvas.width / 2, canvas.height / 2);

  // Glow effect
  ctx.shadowColor = "#ff6b9d";
  ctx.shadowBlur = 20;
  ctx.fillText("🎁🎁HAPPY BIRTHDAY!🎆🎆", canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.PlaneGeometry(32, 5);
  const textMesh = new THREE.Mesh(geometry, material);

  // Vị trí ngẫu nhiên cho chữ
  textMesh.position.set(
    (Math.random() - 0.5) * 150,
    Math.random() * 80 + 20,
    (Math.random() - 0.5) * 150
  );
  textMesh.userData = {
    velocity: new THREE.Vector3(0, 0.5, 0),
    life: 0,
    maxLife: 400, // Tăng từ 180 lên 400
  };

  scene.add(textMesh);
  return textMesh;
}

// Tạo hộp quà có thể click
function createGiftBox() {
  // Sử dụng hình ảnh gift.png thay vì vẽ
  const textureLoader = new THREE.TextureLoader();
  const texture = textureLoader.load("image/gift.png");
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const geometry = new THREE.PlaneGeometry(8, 8); // Tăng từ 3x3 lên 8x8
  const giftBox = new THREE.Mesh(geometry, material);

  // Vị trí gần quả cầu nhưng cách nhau
  const angle = (giftBoxes.length * 120) % 360; // Mỗi hộp cách nhau 120 độ
  const radius = 30 + Math.random() * 10; // Bán kính 30-40
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const z = Math.sin((angle * Math.PI) / 180) * radius;
  const y = 15 + Math.random() * 10; // Cao độ 15-25

  giftBox.position.set(x, y, z);

  // Thêm hiệu ứng xoay nhẹ
  giftBox.rotation.y = Math.random() * Math.PI * 2;
  giftBox.rotation.z = Math.random() * 0.2 - 0.1;

  giftBox.userData = {
    type: "giftBox",
    clicked: false,
    originalY: giftBox.position.y,
    floatSpeed: 0.02 + Math.random() * 0.03,
    rotationSpeed: 0.01 + Math.random() * 0.02,
  };

  scene.add(giftBox);
  return giftBox;
}

function createGiftReward(count) {
  if (count === 1) {
    return "😄 Chúc bạn may mắn lần sau! 😄";
  }
  if (count === 2) {
    return "💋Hụt nữa rồi, đừng vội phần quà vẫn còn phía sau! 💋";
  }
  if (count === 3) {
    return "(┬┬﹏┬┬)Ơ quà đâu... lại hụt rồi(┬┬﹏┬┬)";
  }
}

// Biến đếm số hộp quà đã click
let giftBoxesClicked = 0;
let totalGiftBoxes = 0;

// Hàm reset để cho phép click tiếp
function resetGiftBoxClick() {
  giftBoxesClicked = 0;
  showGiftReward("💕 Giữ lời hứa đấy cưng 😁🤭🤭 💕");
}

// Hàm nhảy modal ra vị trí khác
function jumpModalToNewPosition(popup) {
  // Tạo vị trí ngẫu nhiên cho modal
  const newX = (Math.random() - 0.5) * 200; // -100 đến 100
  const newY = (Math.random() - 0.5) * 100; // -50 đến 50

  // Chỉ cập nhật vị trí modal, không thay đổi nội dung
  popup.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
}

// Hàm nhảy hộp quà đến vị trí khác
function jumpGiftBoxesToNewPosition() {
  giftBoxes.forEach((giftBox, index) => {
    if (!giftBox.userData.clicked) {
      // Nhảy đến vị trí mới gần quả cầu nhưng khác vị trí cũ
      const newAngle = Math.random() * Math.PI * 2;
      const newRadius = 35 + Math.random() * 15; // Gần hơn một chút
      const newX = Math.cos(newAngle) * newRadius;
      const newZ = Math.sin(newAngle) * newRadius;
      const newY = 20 + Math.random() * 15;

      // Hiệu ứng nhảy
      giftBox.position.set(newX, newY, newZ);

      // Đánh dấu không thể click nữa
      giftBox.userData.clicked = true;
      giftBox.userData.jumped = true; // Đánh dấu đã nhảy
    }
  });
  showGiftReward("😄 Hộp quà đã nhảy đến vị trí khác rồi!");
}

function showGiftReward(message, showButtons = false, onAccept) {
  // Tạo popup thông báo
  const popup = document.createElement("div");
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ff6b9d, #ffd93d);
    color: white;
    padding: 20px 30px;
    border-radius: 15px;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: popupIn 0.5s ease-out;
    max-width: 400px;
    word-wrap: break-word;
  `;

  let popupContent = message;

  if (showButtons) {
    popupContent = `
      <div>${message}</div>
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button id="acceptKiss" style="
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        ">💋 Được ok :))</button>
        <button id="skipKiss" style="
          background: #f44336;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: bold;
        ">❌ Mơ đi cưng :))</button>
      </div>
    `;
  }

  popup.innerHTML = popupContent;

  // Thêm CSS animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes popupIn {
      from {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.5);
      }
      to {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(popup);

  // Thêm event listeners cho các nút nếu có
  if (showButtons) {
    const acceptBtn = document.getElementById("acceptKiss");
    const skipBtn = document.getElementById("skipKiss");

    acceptBtn.addEventListener("click", () => {
      if (typeof onAccept === "function") {
        onAccept();
      } else {
        resetGiftBoxClick();
      }
      document.body.removeChild(popup);
    });

    skipBtn.addEventListener("click", () => {
      // Chỉ nhảy modal ra vị trí khác, không thay đổi nội dung
      jumpModalToNewPosition(popup);
    });
  } else {
    // Tự động ẩn sau 3 giây cho thông báo thường
    setTimeout(() => {
      popup.style.animation = "popupOut 0.5s ease-in";
      popup.style.animationFillMode = "forwards";

      const popupOutStyle = document.createElement("style");
      popupOutStyle.textContent = `
        @keyframes popupOut {
          from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
          }
        }
      `;
      document.head.appendChild(popupOutStyle);

      setTimeout(() => {
        document.body.removeChild(popup);
      }, 500);
    }, 6000);
  }
}

// Tạo hiệu ứng confetti
function createConfetti() {
  const confettiGroup = new THREE.Group();
  const confettiCount = 50; // Giảm từ 100 xuống 50

  // Vị trí ngẫu nhiên cho confetti
  const confettiX = (Math.random() - 0.5) * 200;
  const confettiY = Math.random() * 100 + 50;
  const confettiZ = (Math.random() - 0.5) * 200;

  for (let i = 0; i < confettiCount; i++) {
    const geometry = new THREE.PlaneGeometry(0.3, 0.1);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random(), 1, 0.6),
      transparent: true,
      opacity: 0.8,
    });

    const confetti = new THREE.Mesh(geometry, material);
    confetti.position.set(
      confettiX + (Math.random() - 0.5) * 40,
      confettiY + (Math.random() - 0.5) * 40,
      confettiZ + (Math.random() - 0.5) * 40
    );

    confetti.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -Math.random() * 0.3 - 0.1,
        (Math.random() - 0.5) * 0.5
      ),
      rotation: new THREE.Vector3(
        Math.random() * 0.1,
        Math.random() * 0.1,
        Math.random() * 0.1
      ),
      life: 0,
      maxLife: 200,
    };

    confettiGroup.add(confetti);
  }

  confettiGroup.userData = { life: 0, maxLife: 350 }; // Tăng từ 200 lên 350
  scene.add(confettiGroup);
  return confettiGroup;
}

// Tạo hiệu ứng sparkles
function createSparkles() {
  const sparkleGroup = new THREE.Group();
  const sparkleCount = 40; // Giảm từ 80 xuống 40

  // Vị trí ngẫu nhiên cho sparkles
  const sparkleX = (Math.random() - 0.5) * 200;
  const sparkleY = (Math.random() - 0.5) * 200;
  const sparkleZ = (Math.random() - 0.5) * 200;

  for (let i = 0; i < sparkleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.05, 4, 4);
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.5, 1, 0.8),
      transparent: true,
      opacity: 1,
    });

    const sparkle = new THREE.Mesh(geometry, material);
    sparkle.position.set(
      sparkleX + (Math.random() - 0.5) * 60,
      sparkleY + (Math.random() - 0.5) * 60,
      sparkleZ + (Math.random() - 0.5) * 60
    );

    sparkle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      pulse: Math.random() * Math.PI * 2,
      life: 0,
      maxLife: 300,
    };

    sparkleGroup.add(sparkle);
  }

  sparkleGroup.userData = { life: 0, maxLife: 500 }; // Tăng từ 300 lên 500
  scene.add(sparkleGroup);
  return sparkleGroup;
}

// Mảng chứa các hiệu ứng
let birthdayEffects = [];
let giftBoxes = []; // Mảng chứa các hộp quà
let isRoomOut = false; // Biến theo dõi trạng thái room out

// Hàm animate cho các hiệu ứng sinh nhật
function animateBirthdayEffects(time) {
  for (let i = birthdayEffects.length - 1; i >= 0; i--) {
    const effect = birthdayEffects[i];

    if (!effect || !effect.userData) continue;

    effect.userData.life++;

    // Xóa hiệu ứng khi hết thời gian và tạo hiệu ứng mới
    if (effect.userData.life >= effect.userData.maxLife) {
      scene.remove(effect);
      birthdayEffects.splice(i, 1);

      // Tạo hiệu ứng mới ngay lập tức để thay thế (với tần suất thấp hơn)
      if (Math.random() < 0.15) {
        // Giảm từ 0.3 xuống 0.15
        birthdayEffects.push(createFirework());
      } else if (Math.random() < 0.15) {
        // Giảm từ 0.3 xuống 0.15
        birthdayEffects.push(createConfetti());
      } else if (Math.random() < 0.15) {
        // Giảm từ 0.3 xuống 0.15
        birthdayEffects.push(createSparkles());
      } else if (Math.random() < 0.25) {
        // Tăng từ 0.1 lên 0.25 (tăng 2.5 lần)
        birthdayEffects.push(createBirthdayText());
      }
      continue;
    }

    // Animate pháo hoa
    if (effect.userData.particles) {
      effect.userData.particles.forEach((particle) => {
        particle.userData.life++;

        // Cập nhật vị trí
        particle.position.add(particle.userData.velocity);
        particle.userData.velocity.y -= 0.02; // Gravity

        // Fade out
        const lifeRatio = particle.userData.life / particle.userData.maxLife;
        particle.material.opacity = 1 - lifeRatio;

        // Thay đổi màu sắc
        const hue = (time * 0.5 + particle.userData.life * 0.1) % 1;
        particle.material.color.setHSL(hue, 1, 0.5);
      });
    }

    // Animate chữ "HAPPY BIRTHDAY"
    if (effect.userData.velocity) {
      effect.position.add(effect.userData.velocity);
      effect.userData.velocity.y -= 0.01; // Gravity nhẹ

      // Xoay nhẹ
      effect.rotation.z = Math.sin(time * 2) * 0.1;

      // Pulse effect
      const scale = 1 + Math.sin(time * 3) * 0.1;
      effect.scale.setScalar(scale);
    }

    // Animate confetti
    if (effect.children && effect.children.length > 100) {
      // Confetti có nhiều children
      effect.children.forEach((confetti) => {
        if (confetti.userData.velocity) {
          confetti.position.add(confetti.userData.velocity);
          confetti.userData.velocity.y -= 0.015; // Gravity

          // Xoay confetti
          confetti.rotation.x += confetti.userData.rotation.x;
          confetti.rotation.y += confetti.userData.rotation.y;
          confetti.rotation.z += confetti.userData.rotation.z;

          // Fade out
          const lifeRatio = confetti.userData.life / confetti.userData.maxLife;
          confetti.material.opacity = 0.8 * (1 - lifeRatio);

          confetti.userData.life++;
        }
      });
    }

    // Animate sparkles
    if (effect.children && effect.children.length <= 80) {
      // Sparkles có ít children hơn
      effect.children.forEach((sparkle) => {
        if (sparkle.userData.velocity) {
          sparkle.position.add(sparkle.userData.velocity);

          // Pulse effect
          const pulse = Math.sin(time * 4 + sparkle.userData.pulse) * 0.5 + 0.5;
          sparkle.material.opacity = pulse;

          // Thay đổi màu sắc
          const hue = (time * 0.3 + sparkle.userData.pulse) % 1;
          sparkle.material.color.setHSL(hue, 1, 0.8);

          sparkle.userData.life++;
        }
      });
    }
  }
}

// Hàm animate cho các hộp quà
function animateGiftBoxes(time) {
  for (let i = giftBoxes.length - 1; i >= 0; i--) {
    const giftBox = giftBoxes[i];

    if (!giftBox || !giftBox.userData) continue;

    // Hiệu ứng bay lên xuống
    giftBox.position.y =
      giftBox.userData.originalY +
      Math.sin(time * giftBox.userData.floatSpeed) * 2;

    // Hiệu ứng xoay nhẹ
    giftBox.rotation.y += giftBox.userData.rotationSpeed;
    giftBox.rotation.z = Math.sin(time * 2) * 0.1;

    // Hiệu ứng pulse
    const scale = 1 + Math.sin(time * 3) * 0.1;
    giftBox.scale.setScalar(scale);
  }
}

// Hàm tạo hộp quà sau khi hiệu ứng sinh nhật hoàn thành
function spawnGiftBoxes() {
  // Tạo đúng 3 hộp quà duy nhất
  const giftCount = 3;
  totalGiftBoxes = giftCount;
  giftBoxesClicked = 0; // Reset số hộp đã click

  for (let i = 0; i < giftCount; i++) {
    setTimeout(() => {
      giftBoxes.push(createGiftBox());
    }, i * 300); // Tạo từng hộp quà cách nhau 0.3 giây (nhanh hơn)
  }
}

// Hàm room out (lùi ra xa để nhìn rõ ảnh)
function startCameraRoomOut(fromPos) {
  // Vị trí lùi ra, bạn có thể chỉnh lại nếu muốn xa/cận hơn
  const outPos = { x: 0, y: 40, z: 180 };
  const duration = 0.8; // Giảm từ 1.2 xuống 0.8 (nhanh hơn)
  let progress = 0;

  function animateOut() {
    progress += 0.0015; // Tăng từ 0.0012 lên 0.0015 (nhanh hơn)
    let t = Math.min(progress / duration, 1);
    // Ease in-out
    let easedT = 0.5 - 0.5 * Math.cos(Math.PI * t);
    const newPos = {
      x: fromPos.x + (outPos.x - fromPos.x) * easedT,
      y: fromPos.y + (outPos.y - fromPos.y) * easedT,
      z: fromPos.z + (outPos.z - fromPos.z) * easedT,
    };
    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(0, 0, 0);

    // Khi camera đã room out xong, bắt đầu hiệu ứng sinh nhật
    if (t >= 0.05) {
      // Giảm từ 0.2 xuống 0.05 (sớm hơn nhiều)
      isRoomOut = true; // Đánh dấu đã room out
    }

    if (isRoomOut) {
      // Tạo hiệu ứng sinh nhật liên tục với tần suất vừa phải
      if (Math.random() < 0.02) {
        // Giảm từ 0.08 xuống 0.02
        birthdayEffects.push(createFirework());
      }

      if (Math.random() < 0.008) {
        // Giảm từ 0.03 xuống 0.008
        birthdayEffects.push(createBirthdayText());
      }

      if (Math.random() < 0.015) {
        // Giảm từ 0.06 xuống 0.015
        birthdayEffects.push(createConfetti());
      }

      if (Math.random() < 0.012) {
        // Giảm từ 0.05 xuống 0.012
        birthdayEffects.push(createSparkles());
      }

      // Thêm hiệu ứng âm thanh nhỏ (nếu có thể)
      if (Math.random() < 0.005) {
        // 0.5% chance mỗi frame
        try {
          const audioContext = new (window.AudioContext ||
            window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(
            200,
            audioContext.currentTime + 0.3
          );

          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.3
          );

          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
          // Bỏ qua nếu không thể tạo âm thanh
        }
      }
    }

    if (t < 1) {
      requestAnimationFrame(animateOut);
    } else {
      camera.position.set(outPos.x, outPos.y, outPos.z);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
      // Sau khi room out xong, zoom in lại
      startCameraRoomInAgain(outPos);
    }
  }
  animateOut();
}

// Hàm zoom in lại vào gần các hình ảnh/trái tim
function startCameraRoomInAgain(fromPos) {
  const inPos = { x: -1.2722584825305696, y: 0.6287088547494228, z: 40 }; // vị trí nghiêng từ trên xuống
  const lookAtTarget = { x: 0, y: 10, z: 0 }; // nhìn hơi xuống dưới

  const duration = 0.7; // Giảm từ 1.0 xuống 0.7 (nhanh hơn)
  let progress = 0;

  function animateIn() {
    progress += 0.0015; // Tăng từ 0.0012 lên 0.0015 (nhanh hơn)
    let t = Math.min(progress / duration, 1);
    let easedT = 0.5 - 0.5 * Math.cos(Math.PI * t);
    const newPos = {
      x: fromPos.x + (inPos.x - fromPos.x) * easedT,
      y: fromPos.y + (inPos.y - fromPos.y) * easedT,
      z: fromPos.z + (inPos.z - fromPos.z) * easedT,
    };
    camera.position.set(newPos.x, newPos.y, newPos.z);
    camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
    if (t < 1) {
      requestAnimationFrame(animateIn);
    } else {
      camera.position.set(inPos.x, inPos.y, inPos.z);
      camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
      controls.target.set(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
      controls.update();
      controls.enabled = true;
      isRoomOut = false; // Reset trạng thái room out

      // Tạo hộp quà sau khi room in hoàn thành
      setTimeout(() => {
        spawnGiftBoxes();
      }, 2000);
    }
  }
  animateIn();
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let introStarted = false;

// Giới hạn số lượng sao hiển thị ban đầu
const originalStarCount = starGeometry.getAttribute("position").count;
if (starField && starField.geometry) {
  starField.geometry.setDrawRange(0, Math.floor(originalStarCount * 0.1));
}

function requestFullScreen() {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.mozRequestFullScreen) {
    // Firefox
    elem.mozRequestFullScreen();
  } else if (elem.webkitRequestFullscreen) {
    // Chrome, Safari, Opera
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) {
    // IE/Edge
    elem.msRequestFullscreen();
  }
}
function onCanvasClick(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Kiểm tra click vào hộp quà trước
  if (introStarted && giftBoxes.length > 0) {
    const giftBoxIntersects = raycaster.intersectObjects(giftBoxes);
    if (giftBoxIntersects.length > 0) {
      const clickedGiftBox = giftBoxIntersects[0].object;

      if (!clickedGiftBox.userData.clicked) {
        // Kiểm tra xem đã click đủ hộp quà chưa
        if (giftBoxesClicked === 1) {
          // Đã click 1 hộp, yêu cầu hôn với nút chọn
          showGiftReward(
            "💋 Rep tin nhắn quá lâu, rep nhanh hơn để mở quà này ! 💋",
            true,
            () => {
              // Đánh dấu đã click
              clickedGiftBox.userData.clicked = true;
              giftBoxesClicked++;
              // Hiệu ứng khi click
              clickedGiftBox.scale.setScalar(1.5);
              setTimeout(() => {
                clickedGiftBox.scale.setScalar(1);
              }, 200);
              // Hiển thị phần thưởng
              const reward = createGiftReward(2);
              showGiftReward(reward);
              // Xóa hộp quà sau khi click
              setTimeout(() => {
                scene.remove(clickedGiftBox);
                const index = giftBoxes.indexOf(clickedGiftBox);
                if (index > -1) {
                  giftBoxes.splice(index, 1);
                }
              }, 1000);
            }
          );
          return;
        }
        if (giftBoxesClicked === 2) {
          // Đã click 2 hộp, yêu cầu cầu hôn với modal khác
          showGiftReward(
            "(❁´◡`❁) Hmm, chưa đủ chân thành rồi, nhớ giữ lời hứa ban đầu nhá 🤭",
            true,
            () => {
              // Đánh dấu đã click
              clickedGiftBox.userData.clicked = true;
              giftBoxesClicked++;
              // Hiệu ứng khi click
              clickedGiftBox.scale.setScalar(1.5);
              setTimeout(() => {
                clickedGiftBox.scale.setScalar(1);
              }, 200);
              // Hiển thị phần thưởng
              const reward = createGiftReward(3);
              showGiftReward(reward);
              // Xóa hộp quà sau khi click
              setTimeout(() => {
                scene.remove(clickedGiftBox);
                const index = giftBoxes.indexOf(clickedGiftBox);
                if (index > -1) {
                  giftBoxes.splice(index, 1);
                }
              }, 1000);
              // Hiển thị thêm 1 thông báo sau khi reward đã hiện xong
              setTimeout(() => {
                showGiftReward(
                  "😡Aww ! tức giận rồi đúng không! Mất niềm tin rồi đúng không! Ngôi sao của mình chỉ quanh quẩn trong ngân hà này thôi tìm kỹ nhá, 😉😉😉"
                );
              }, 6500); // 6s reward + 0.5s fade out
            }
          );
          return;
        }

        // Đánh dấu đã click
        clickedGiftBox.userData.clicked = true;
        giftBoxesClicked++;

        // Hiệu ứng khi click
        clickedGiftBox.scale.setScalar(1.5);
        setTimeout(() => {
          clickedGiftBox.scale.setScalar(1);
        }, 200);

        // Hiển thị phần thưởng (hộp đầu tiên luôn là may mắn lần sau)
        const reward = createGiftReward(1);
        showGiftReward(reward);

        // Xóa hộp quà sau khi click
        setTimeout(() => {
          scene.remove(clickedGiftBox);
          const index = giftBoxes.indexOf(clickedGiftBox);
          if (index > -1) {
            giftBoxes.splice(index, 1);
          }
        }, 1000);

        return;
      }
    }
  }

  if (introStarted) return;

  const intersects = raycaster.intersectObject(planet);

  if (intersects.length > 0) {
    requestFullScreen();
    introStarted = true;
    fadeInProgress = true;
    document.body.classList.add("intro-started");
    startCameraAnimation();

    // --- LOGIC SỬA LỖI AUTOPLAY ---
    if (window.musicManager) {
      // Cố gắng phát nhạc ngay lập tức
      window.musicManager.play().catch((error) => {
        // Nếu trình duyệt chặn (lỗi NotAllowedError), không cần làm gì ở đây.
        // Nút togglePlayback sẽ xử lý việc này sau.
        console.warn(
          "Autoplay bị chặn, người dùng cần tương tác với nút âm thanh.",
          error
        );

        // Quan trọng: Đánh dấu rằng người dùng đã có ý định bật nhạc.
        // Điều này giúp nút toggle hoạt động đúng ngay lần nhấn đầu tiên.
        if (window.musicManager.audio) {
          // Chúng ta không thực sự tắt, chỉ cập nhật UI để nó trông như bị tắt
          // và chờ người dùng nhấn nút.
          window.musicManager.audio.muted = true; // Tạm thời tắt tiếng
          window.musicManager.updateUI(); // Cập nhật icon
        }
      });
    } else {
      console.error("musicManager chưa được khởi tạo!");
    }
    // --- KẾT THÚC LOGIC SỬA LỖI ---
    if (starField && starField.geometry) {
      starField.geometry.setDrawRange(0, originalStarCount);
    }

    // Bắt đầu hiệu ứng sinh nhật ngay lập tức
    isRoomOut = true;

    // Hộp quà sẽ xuất hiện sau khi room in hoàn thành
  } else if (introStarted) {
    const heartIntersects = raycaster.intersectObjects(heartPointClouds);
    if (heartIntersects.length > 0) {
      const targetObject = heartIntersects[0].object;
      controls.target.copy(targetObject.position);
    }
  }
}

renderer.domElement.addEventListener("click", onCanvasClick);

animate();

planet.name = "main-planet";
centralGlow.name = "main-glow";

// ---- CÁC THIẾT LẬP CHO GIAO DIỆN VÀ MOBILE ----
function setFullScreen() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  const container = document.getElementById("container");
  if (container) {
    container.style.height = `${window.innerHeight}px`;
  }
}

window.addEventListener("resize", setFullScreen);
window.addEventListener("orientationchange", () => {
  setTimeout(setFullScreen, 300);
});
setFullScreen();

const preventDefault = (event) => event.preventDefault();
document.addEventListener("touchmove", preventDefault, { passive: false });
document.addEventListener("gesturestart", preventDefault, { passive: false });

const container = document.getElementById("container");
if (container) {
  container.addEventListener("touchmove", preventDefault, { passive: false });
}

// =======================================================================
// ---- KIỂM TRA HƯỚNG MÀN HÌNH ĐỂ HIỂN THỊ CẢNH BÁO ----
// =======================================================================

function checkOrientation() {
  // Kiểm tra nếu chiều cao lớn hơn chiều rộng (màn hình dọc trên điện thoại)
  // Thêm một điều kiện nhỏ để không kích hoạt trên màn hình desktop hẹp.
  const isMobilePortrait =
    window.innerHeight > window.innerWidth && "ontouchstart" in window;

  if (isMobilePortrait) {
    document.body.classList.add("portrait-mode");
  } else {
    document.body.classList.remove("portrait-mode");
  }
}

// Lắng nghe các sự kiện để kiểm tra lại hướng màn hình
window.addEventListener("DOMContentLoaded", checkOrientation);
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", () => {
  // Thêm độ trễ để trình duyệt cập nhật kích thước chính xác
  setTimeout(checkOrientation, 200);
});

// Hàm log tọa độ camera khi di chuột
function logCameraPositionOnMouseMove() {
  window.addEventListener("mousemove", () => {
    const pos = camera.position;
    console.log(`Camera position: x=${pos.x}, y=${pos.y}, z=${pos.z}`);
  });
}
logCameraPositionOnMouseMove();
