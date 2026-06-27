import * as THREE from "https://esm.sh/three@0.165.0";
import { OrbitControls } from "https://esm.sh/three@0.165.0/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "https://esm.sh/three@0.165.0/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "https://esm.sh/three@0.165.0/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "https://esm.sh/three@0.165.0/examples/jsm/postprocessing/UnrealBloomPass.js";

// ---------- ADVANCED CONFIG ----------
const APP = {
    paused: false,
    themeIdx: 0,
    formationIdx: 0,
    density: 0.8, // Slightly lower density for optimal hero section background performance
    clock: new THREE.Clock()
};

// Enhanced vibrant palettes matching the corporate technology brand
const PALETTES = [
    [0xe94560, 0xff6b6b, 0xff8787, 0xffa0a0, 0x9b2c2c], // Solar Flare (Vibrant Crimson Red - Brand Accent)
    [0x9f7aea, 0x805ad5, 0xd6bcfa, 0xb794f4, 0x6b46c1], // Nebula Violet
    [0x4299e1, 0x3182ce, 0x90cdf4, 0x63b3ed, 0x2b6cb0], // Deep Azure
    [0x48bb78, 0x38a169, 0x9ae6b4, 0x68d391, 0x276749]  // Emerald Nebula
];

// Setup Scene
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a1a2e, 0.001); // Match the CSS body background theme color

const container = document.querySelector('.hero');
const width = container ? container.clientWidth : window.innerWidth;
const height = container ? container.clientHeight : window.innerHeight;

const camera = new THREE.PerspectiveCamera(58, width / height, 0.1, 200);
camera.position.set(2, 5, 20); // Balanced zoom for background layout

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas-neural'),
    antialias: true,
    alpha: true, // Transparent background to show premium gradient orbs behind
    powerPreference: "high-performance"
});
renderer.setSize(width, height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 1.2;

// Post Processing Bloom
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 1.2, 0.4, 0.85);
bloomPass.threshold = 0.15;
bloomPass.strength = 1.0;
bloomPass.radius = 0.7;
const effectComposer = new EffectComposer(renderer);
effectComposer.addPass(renderScene);
effectComposer.addPass(bloomPass);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.rotateSpeed = 0.8;
controls.zoomSpeed = 1.0;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.25; // Gentle rotation for background
controls.minDistance = 6;
controls.maxDistance = 40;

// Starfield particle system
const starCount = 2000;
const starGeo = new THREE.BufferGeometry();
const starPos = [];
const starColor = [];
for (let i = 0; i < starCount; i++) {
    const r = 60 + Math.random() * 80;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    const bright = 0.3 + Math.random() * 0.7;
    starColor.push(bright, bright * 0.8, bright);
}
starGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPos), 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(starColor), 3));
const starMat = new THREE.PointsMaterial({ size: 0.15, vertexColors: true, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending });
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// ---------- SHARED PULSE SYSTEM ----------
const pulseState = {
    positions: [new THREE.Vector3(999, 999, 999), new THREE.Vector3(999, 999, 999), new THREE.Vector3(999, 999, 999)],
    times: [-999, -999, -999],
    colors: [new THREE.Color(0xffffff), new THREE.Color(0xffffff), new THREE.Color(0xffffff)],
    nextIdx: 0
};

// ---- Custom Shaders ----
const vertexNoise = `
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy) );
        vec3 x0 = v - i + dot(i, C.xxx) ;
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute( permute( permute( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }
`;

const nodeUniforms = {
    uTime: { value: 0 },
    uPulsePositions: { value: pulseState.positions },
    uPulseTimes: { value: pulseState.times },
    uPulseSpeed: { value: 14.0 },
    uBaseSize: { value: 0.6 },
    uPulseColors: { value: pulseState.colors }
};

const nodeVertex = `${vertexNoise}
    attribute float aSize;
    attribute float aType;
    attribute vec3 aColor;
    attribute float aDepth;
    uniform float uTime;
    uniform vec3 uPulsePositions[3];
    uniform float uPulseTimes[3];
    uniform float uPulseSpeed;
    uniform float uBaseSize;
    varying vec3 vColor;
    varying float vIntensity;
    varying float vDepth;
    
    float pulseWave(vec3 worldPos, vec3 pulsePos, float tClick) {
        if(tClick < 0.0) return 0.0;
        float elapsed = uTime - tClick;
        if(elapsed < 0.0 || elapsed > 3.5) return 0.0;
        float radius = elapsed * uPulseSpeed;
        float dist = distance(worldPos, pulsePos);
        float width = 2.0;
        float val = 1.0 - smoothstep(0.0, width, abs(dist - radius));
        return val * (1.0 - elapsed/3.5);
    }
    
    void main() {
        vColor = aColor;
        vDepth = aDepth;
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        float totalPulse = 0.0;
        for(int i=0; i<3; i++) {
            totalPulse += pulseWave(worldPos, uPulsePositions[i], uPulseTimes[i]);
        }
        vIntensity = clamp(totalPulse, 0.0, 1.0);
        float wiggle = snoise(position * 0.1 + uTime * 0.3) * 0.1;
        vec3 posOffset = position + normal * wiggle * aType;
        float scale = aSize * (0.8 + 0.3 * sin(uTime * 1.0 + aDepth * 0.3));
        if(vIntensity > 0.1) scale *= (1.0 + vIntensity * 2.0);
        vec4 mvPos = modelViewMatrix * vec4(posOffset, 1.0);
        gl_PointSize = (scale * uBaseSize * 300.0) / -mvPos.z;
        gl_Position = projectionMatrix * mvPos;
    }
`;

const nodeFragment = `
    uniform float uTime;
    uniform vec3 uPulseColors[3];
    varying vec3 vColor;
    varying float vIntensity;
    varying float vDepth;
    void main() {
        vec2 coord = gl_PointCoord;
        float dist = length(coord - 0.5) * 2.0;
        if(dist > 1.0) discard;
        float glow = (1.0 - dist) * 1.2;
        vec3 baseCol = vColor;
        if(vIntensity > 0.05) {
            baseCol = mix(baseCol, uPulseColors[0] * 1.4, vIntensity * 0.9);
        }
        float sparkle = pow(glow, 1.5);
        vec3 finalColor = baseCol * (0.6 + 0.6 * sparkle);
        finalColor += vec3(0.8, 0.5, 1.0) * vIntensity * 1.2;
        gl_FragColor = vec4(finalColor, glow * 0.9);
    }
`;

const edgeVertex = `${vertexNoise}
    attribute vec3 aStart;
    attribute vec3 aEnd;
    attribute float aStrength;
    attribute vec3 aEdgeColor;
    attribute float aSegId;
    uniform float uTime;
    uniform vec3 uPulsePositions[3];
    uniform float uPulseTimes[3];
    uniform float uPulseSpeed;
    varying float vAlpha;
    varying vec3 vColor;
    
    float pulseLine(vec3 worldPos, vec3 pulsePos, float tClick) {
        if(tClick < 0.0) return 0.0;
        float elapsed = uTime - tClick;
        if(elapsed < 0.0 || elapsed > 3.5) return 0.0;
        float radius = elapsed * uPulseSpeed;
        float dist = distance(worldPos, pulsePos);
        float width = 1.6;
        return (1.0 - smoothstep(0.0, width, abs(dist - radius))) * (1.0 - elapsed/3.5);
    }
    
    void main() {
        float t = position.x;
        vec3 p0 = aStart, p1 = aEnd;
        vec3 mid = (p0 + p1) * 0.5;
        vec3 dir = normalize(p1 - p0);
        vec3 perp = normalize(cross(dir, vec3(0.0, 1.0, 0.5)));
        float offset = sin(t * 3.14159) * 0.1;
        vec3 curvePoint = mix(p0, p1, t);
        curvePoint += perp * offset;
        float noiseFlow = snoise(vec3(t * 4.0, aSegId * 0.4, uTime * 0.4)) * 0.05;
        curvePoint += perp * noiseFlow;
        vec3 worldPos = (modelMatrix * vec4(curvePoint, 1.0)).xyz;
        float pulseIntensity = 0.0;
        for(int i=0; i<3; i++) {
            pulseIntensity += pulseLine(worldPos, uPulsePositions[i], uPulseTimes[i]);
        }
        pulseIntensity = clamp(pulseIntensity, 0.0, 1.0);
        vColor = aEdgeColor;
        vAlpha = (0.4 + 0.4 * sin(t * 15.0 - uTime * 8.0)) * aStrength;
        vAlpha += pulseIntensity * 1.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(curvePoint, 1.0);
    }
`;

const edgeFragment = `
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
        float finalAlpha = clamp(vAlpha, 0.15, 1.0);
        gl_FragColor = vec4(vColor, finalAlpha * 0.75);
    }
`;

let currentPoints = null, currentLines = null;

// ---- NETWORK GENERATORS ----
function generateSynapticWeb(formation, density) {
    const nodes = [];
    let root = null;
    const factor = Math.max(0.35, density);

    if (formation === 0) {
        const layers = 5;
        root = { pos: new THREE.Vector3(0,0,0), level: 0, type: 0, size: 1.3, dist: 0, connections: [] };
        nodes.push(root);
        for (let l = 1; l <= layers; l++) {
            const rad = l * 3.4;
            let count = Math.floor(12 * l * factor);
            for (let i = 0; i < count; i++) {
                const phi = Math.acos(1 - 2 * (i + 0.5) / count);
                const theta = Math.PI * 2 * i * 0.618;
                const pos = new THREE.Vector3(rad * Math.sin(phi) * Math.cos(theta), rad * Math.sin(phi) * Math.sin(theta), rad * Math.cos(phi));
                const isLeaf = l === layers || Math.random() < 0.25;
                const node = { pos, level: l, type: isLeaf ? 1 : 0, size: 0.5 + Math.random() * 0.5, dist: rad, connections: [] };
                nodes.push(node);
                if (l > 1) {
                    const prevNodes = nodes.filter(n => n.level === l-1 && n !== root);
                    prevNodes.sort((a,b) => a.pos.distanceTo(pos) - b.pos.distanceTo(pos));
                    for(let j=0; j<Math.min(3, prevNodes.length); j++) {
                        const str = 1.0 - (pos.distanceTo(prevNodes[j].pos) / (rad * 1.5));
                        node.connections.push({ node: prevNodes[j], strength: Math.max(0.3, str) });
                        prevNodes[j].connections.push({ node: node, strength: Math.max(0.3, str) });
                    }
                } else {
                    root.connections.push({ node, strength: 0.85 });
                    node.connections.push({ node: root, strength: 0.85 });
                }
            }
        }
    } else if (formation === 1) {
        const helices = 4;
        const steps = Math.floor(45 * factor);
        const height = 22;
        root = { pos: new THREE.Vector3(0,-6,0), level: 0, type: 0, size: 1.3, dist: 0, connections: [] };
        nodes.push(root);
        const helixNodes = [];
        for (let h = 0; h < helices; h++) {
            const arr = [];
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const y = -5 + t * height;
                const rad = 5.0 * Math.sin(t * Math.PI);
                const angle = h * Math.PI * 2 / helices + t * Math.PI * 4;
                const pos = new THREE.Vector3(rad * Math.cos(angle), y, rad * Math.sin(angle));
                const isLeaf = t > 0.85;
                const node = { pos, level: Math.floor(t * 5), type: isLeaf ? 1 : 0, size: 0.5 + Math.random() * 0.5, dist: Math.hypot(pos.x, pos.y, pos.z), connections: [] };
                nodes.push(node);
                arr.push(node);
                if (i === 0) {
                    root.connections.push({ node, strength: 0.9 });
                    node.connections.push({ node: root, strength: 0.9 });
                }
                if (i > 0) {
                    const prev = arr[i-1];
                    node.connections.push({ node: prev, strength: 0.95 });
                    prev.connections.push({ node: node, strength: 0.95 });
                }
            }
            helixNodes.push(arr);
        }
        for (let h = 0; h < helices; h++) {
            const next = helixNodes[(h+1) % helices];
            for (let i = 5; i < helixNodes[h].length; i+=6) {
                const idx = Math.floor((i / steps) * (next.length-1));
                if (next[idx]) {
                    helixNodes[h][i].connections.push({ node: next[idx], strength: 0.6 });
                    next[idx].connections.push({ node: helixNodes[h][i], strength: 0.6 });
                }
            }
        }
    } else if (formation === 2) {
        const maxDepth = 3;
        root = { pos: new THREE.Vector3(0,0,0), level: 0, type: 0, size: 1.4, dist: 0, connections: [] };
        nodes.push(root);
        function grow(parent, dir, depth, strScale) {
            if (depth > maxDepth) return;
            const len = 4.0 / (depth * 0.6 + 0.8);
            const newPos = parent.pos.clone().add(dir.clone().multiplyScalar(len));
            const isLeaf = depth === maxDepth || Math.random() < 0.2;
            const child = { pos: newPos, level: depth, type: isLeaf ? 1 : 0, size: 0.5, dist: parent.dist + len, connections: [] };
            nodes.push(child);
            parent.connections.push({ node: child, strength: 0.85 * strScale });
            child.connections.push({ node: parent, strength: 0.85 * strScale });
            const subBranches = depth === 1 ? 3 : 2;
            for (let s = 0; s < subBranches; s++) {
                const angleY = (s / subBranches) * Math.PI * 2;
                const angleX = Math.sin(angleY) * 0.8;
                const newDir = dir.clone().add(new THREE.Vector3(Math.cos(angleY) * 0.6, Math.sin(angleY) * 0.6, angleX)).normalize();
                grow(child, newDir, depth+1, strScale * 0.75);
            }
        }
        const baseDirs = [
            new THREE.Vector3(1,0.2,0),
            new THREE.Vector3(-0.8,0.5,0.5),
            new THREE.Vector3(0.3,-0.9,0.2),
            new THREE.Vector3(-0.3,-0.5,-0.8),
            new THREE.Vector3(0.7,0.7,-0.4),
            new THREE.Vector3(-0.5,-0.2,0.9)
        ];
        for(let d of baseDirs) grow(root, d.normalize(), 1, 1.0);
    } else if (formation === 3) {
        root = { pos: new THREE.Vector3(0,0,0), level: 0, type: 0, size: 1.4, dist: 0, connections: [] };
        nodes.push(root);

        const outerR = 14;
        const innerR = 10;
        const centerR = 7;
        const perEdge = Math.max(8, Math.floor(12 * factor));

        function addNode(x, y, z, level, type, size) {
            const node = {
                pos: new THREE.Vector3(x, y, z),
                level,
                type,
                size,
                dist: Math.hypot(x, y, z),
                connections: []
            };
            nodes.push(node);
            return node;
        }

        function linkRing(arr, strength) {
            for (let i = 0; i < arr.length; i++) {
                const a = arr[i];
                const b = arr[(i + 1) % arr.length];
                a.connections.push({ node: b, strength });
                b.connections.push({ node: a, strength });
            }
        }

        const outer = [];
        const inner = [];
        const center = [];

        const outerPts = [[0, -outerR], [outerR, 0], [0, outerR], [-outerR, 0]];
        const innerPts = [[0, -innerR], [innerR, 0], [0, innerR], [-innerR, 0]];
        const centerPts = [[0, -centerR], [centerR, 0], [0, centerR], [-centerR, 0]];

        for (let e = 0; e < 4; e++) {
            const [x0, y0] = outerPts[e];
            const [x1, y1] = outerPts[(e + 1) % 4];
            for (let i = 0; i < perEdge; i++) {
                const t = i / (perEdge - 1);
                outer.push(addNode(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0, 1, 0, 0.95));
            }
        }

        for (let e = 0; e < 4; e++) {
            const [x0, y0] = innerPts[e];
            const [x1, y1] = innerPts[(e + 1) % 4];
            for (let i = 0; i < perEdge - 2; i++) {
                const t = i / (perEdge - 3);
                inner.push(addNode(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0, 2, 1, 0.85));
            }
        }

        for (let e = 0; e < 4; e++) {
            const [x0, y0] = centerPts[e];
            const [x1, y1] = centerPts[(e + 1) % 4];
            for (let i = 0; i < perEdge - 4; i++) {
                const t = i / (perEdge - 5);
                center.push(addNode(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0, 3, 1, 1.0));
            }
        }

        linkRing(outer, 0.9);
        linkRing(inner, 0.85);
        linkRing(center, 1.0);

        for (let i = 0; i < Math.min(outer.length, inner.length); i += 4) {
            outer[i].connections.push({ node: inner[i % inner.length], strength: 0.55 });
            inner[i % inner.length].connections.push({ node: outer[i], strength: 0.55 });
        }

        for (let i = 0; i < Math.min(inner.length, center.length); i += 3) {
            inner[i].connections.push({ node: center[i % center.length], strength: 0.45 });
            center[i % center.length].connections.push({ node: inner[i], strength: 0.45 });
        }

        if (density < 0.7) {
            const keepRatio = density + 0.2;
            const filtered = nodes.filter(n => n === root || Math.random() < keepRatio);
            const finalSet = new Set(filtered);
            finalSet.forEach(n => {
                n.connections = n.connections.filter(c => finalSet.has(c.node));
            });
            return { nodes: Array.from(finalSet), root };
        }

        return { nodes, root };
    }

    if (density < 0.7) {
        const keepRatio = density + 0.2;
        const filtered = nodes.filter(n => n === root || Math.random() < keepRatio);
        const finalSet = new Set(filtered);
        finalSet.forEach(n => {
            n.connections = n.connections.filter(c => finalSet.has(c.node));
        });
        return { nodes: Array.from(finalSet), root };
    }
    return { nodes, root };
}

function buildVisualization() {
    if (currentPoints) scene.remove(currentPoints);
    if (currentLines) scene.remove(currentLines);
    const { nodes } = generateSynapticWeb(APP.formationIdx, APP.density);
    const palette = PALETTES[APP.themeIdx];
    
    const posArr = [], types = [], sizes = [], colors = [], depths = [];
    nodes.forEach(node => {
        posArr.push(node.pos.x, node.pos.y, node.pos.z);
        types.push(node.type);
        sizes.push(node.size);
        depths.push(node.dist);
        const col = new THREE.Color(palette[Math.min(node.level, palette.length - 1)]);
        col.offsetHSL((Math.random() - 0.5) * 0.05, 0.1, 0.05);
        colors.push(col.r, col.g, col.b);
    });
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
    nodeGeo.setAttribute('aType', new THREE.BufferAttribute(new Float32Array(types), 1));
    nodeGeo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(sizes), 1));
    nodeGeo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(colors), 3));
    nodeGeo.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(depths), 1));
    const nodeMat = new THREE.ShaderMaterial({
        uniforms: nodeUniforms,
        vertexShader: nodeVertex,
        fragmentShader: nodeFragment,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    currentPoints = new THREE.Points(nodeGeo, nodeMat);
    scene.add(currentPoints);
    
    const edgeStarts = [], edgeEnds = [], strengths = [], edgeColorsArr = [], segIds = [];
    let edgeCount = 0;
    const seen = new Set();
    nodes.forEach((node, idx) => {
        node.connections.forEach(conn => {
            const targetIdx = nodes.findIndex(n => n === conn.node);
            if (targetIdx === -1) return;
            const key = `${Math.min(idx, targetIdx)}-${Math.max(idx, targetIdx)}`;
            if (seen.has(key)) return;
            seen.add(key);
            const start = node.pos, end = conn.node.pos;
            const segments = 16;
            const avgLevel = Math.min(Math.floor((node.level + conn.node.level) / 2), palette.length - 1);
            const baseCol = new THREE.Color(palette[avgLevel]);
            for (let s = 0; s < segments; s++) {
                const t = s / (segments - 1);
                edgeStarts.push(start.x, start.y, start.z);
                edgeEnds.push(end.x, end.y, end.z);
                strengths.push(conn.strength);
                edgeColorsArr.push(baseCol.r, baseCol.g, baseCol.b);
                segIds.push(edgeCount);
            }
            edgeCount++;
        });
    });
    const edgeGeo = new THREE.BufferGeometry();
    // One scalar interpolation value per edge vertex. edgeStarts stores XYZ triples,
    // so using its raw array length created three times too many vertices and left
    // the custom attributes out of bounds, producing NaN geometry in Three.js.
    const edgeVertexCount = edgeStarts.length / 3;
    const tPositions = [];
    for (let i = 0; i < edgeVertexCount; i++) {
        tPositions.push((i % 16) / 15, 0, 0);
    }
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tPositions), 3));
    edgeGeo.setAttribute('aStart', new THREE.BufferAttribute(new Float32Array(edgeStarts), 3));
    edgeGeo.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(edgeEnds), 3));
    edgeGeo.setAttribute('aStrength', new THREE.BufferAttribute(new Float32Array(strengths), 1));
    edgeGeo.setAttribute('aEdgeColor', new THREE.BufferAttribute(new Float32Array(edgeColorsArr), 3));
    edgeGeo.setAttribute('aSegId', new THREE.BufferAttribute(new Float32Array(segIds), 1));
    const edgeMat = new THREE.ShaderMaterial({
        uniforms: nodeUniforms,
        vertexShader: edgeVertex,
        fragmentShader: edgeFragment,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    currentLines = new THREE.LineSegments(edgeGeo, edgeMat);
    scene.add(currentLines);
}

function updateTheme(index) {
    APP.themeIdx = index;
    buildVisualization();
}

function triggerPulse(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const planeNormal = camera.position.clone().normalize();
    const plane = new THREE.Plane(planeNormal, camera.position.length() * 0.6);
    const point = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, point)) {
        const now = APP.clock.getElapsedTime();
        const idx = pulseState.nextIdx % 3;
        pulseState.positions[idx].copy(point);
        pulseState.times[idx] = now;
        const randCol = new THREE.Color(PALETTES[APP.themeIdx][Math.floor(Math.random() * PALETTES[APP.themeIdx].length)]);
        pulseState.colors[idx].copy(randCol);
        pulseState.nextIdx++;
        if (currentPoints) currentPoints.material.uniforms.uPulseTimes.value = pulseState.times;
        if (currentLines) currentLines.material.uniforms.uPulseTimes.value = pulseState.times;
    }
}

// Event binding to entire Hero element
const heroElement = document.querySelector('.hero');
if (heroElement) {
    heroElement.addEventListener('click', (e) => {
        // If clicking navbar, buttons or interactive widget, skip pulse
        if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.neural-widget') || e.target.closest('.navbar')) return;
        if (!APP.paused) triggerPulse(e.clientX, e.clientY);
    });
}

document.querySelectorAll('.theme-dot').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering pulse on clicking dots
        const th = parseInt(btn.dataset.theme, 10);
        updateTheme(th);
        document.querySelectorAll('.theme-dot').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

const morphBtn = document.getElementById('morphBtn');
if (morphBtn) {
    morphBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        APP.formationIdx = (APP.formationIdx + 1) % 4;
        buildVisualization();
        controls.autoRotate = false;
        setTimeout(() => controls.autoRotate = true, 1800);
    });
}

const resetCamBtn = document.getElementById('resetCamBtn');
if (resetCamBtn) {
    resetCamBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        camera.position.set(2, 5, 20);
        controls.target.set(0, 0, 0);
        controls.update();
        controls.autoRotate = true;
        if (APP.paused) {
            APP.paused = false;
            controls.autoRotate = true;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    const t = APP.clock.getElapsedTime();
    if (!APP.paused) {
        if (currentPoints) currentPoints.material.uniforms.uTime.value = t;
        if (currentLines) currentLines.material.uniforms.uTime.value = t;
        starField.rotation.y += 0.0003;
        starField.rotation.x = Math.sin(t * 0.05) * 0.02;
    }
    controls.update();
    effectComposer.render();
}

buildVisualization();
animate();

window.addEventListener('resize', () => {
    const w = container ? container.clientWidth : window.innerWidth;
    const h = container ? container.clientHeight : window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    effectComposer.setSize(w, h);
});
