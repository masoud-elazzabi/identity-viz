// Masoud — Visual Identity
// A luminous particle sphere: a persistent signal that breathes.

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let width, height, centerX, centerY;
const PARTICLE_COUNT = 5500;
const BASE_RADIUS = 650;

const particles = [];
let time = 0;

// Color palette — deep space blues and warm amber/gold
const palette = {
    blue:   { r: 60,  g: 130, b: 220 },
    deep:   { r: 20,  g: 50,  b: 120 },
    amber:  { r: 240, g: 180, b: 60  },
    gold:   { r: 255, g: 210, b: 100 },
    white:  { r: 220, g: 230, b: 255 },
};

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
}

// Distribute points on a sphere using fibonacci spiral
function fibSphere(i, total) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    return { phi, theta };
}

function initParticles() {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const { phi, theta } = fibSphere(i, PARTICLE_COUNT);
        const layer = Math.random();

        // Decide particle type
        let type, size, colorMix;
        if (layer < 0.04) {
            type = 'core';       // bright core particles
            size = 2 + Math.random() * 2.5;
            colorMix = 0.8 + Math.random() * 0.2;
        } else if (layer < 0.25) {
            type = 'inner';      // warm amber particles
            size = 1 + Math.random() * 1.8;
            colorMix = 0.4 + Math.random() * 0.4;
        } else {
            type = 'surface';    // blue surface particles
            size = 0.5 + Math.random() * 1.4;
            colorMix = Math.random() * 0.3;
        }

        particles.push({
            basePhi: phi,
            baseTheta: theta,
            phi, theta,
            radius: BASE_RADIUS * (type === 'core' ? 0.3 + Math.random() * 0.3 :
                                    type === 'inner' ? 0.5 + Math.random() * 0.4 :
                                    0.85 + Math.random() * 0.15),
            size,
            type,
            colorMix,  // 0 = blue, 1 = amber
            phase: Math.random() * Math.PI * 2,
            speed: 0.2 + Math.random() * 0.8,
            drift: (Math.random() - 0.5) * 0.002,
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.5 + Math.random() * 1.5,
        });
    }
}

function getColor(p, alpha) {
    const t = p.colorMix;
    const breathe = Math.sin(time * 0.3 + p.pulsePhase) * 0.5 + 0.5;

    // Shift color slightly with breathing
    const shift = t + breathe * 0.15;

    let r, g, b;
    if (shift < 0.5) {
        const s = shift / 0.5;
        r = palette.deep.r + (palette.blue.r - palette.deep.r) * s;
        g = palette.deep.g + (palette.blue.g - palette.deep.g) * s;
        b = palette.deep.b + (palette.blue.b - palette.deep.b) * s;
    } else {
        const s = (shift - 0.5) / 0.5;
        r = palette.blue.r + (palette.amber.r - palette.blue.r) * s;
        g = palette.blue.g + (palette.amber.g - palette.blue.g) * s;
        b = palette.blue.b + (palette.amber.b - palette.blue.b) * s;
    }

    // Core particles get extra brightness
    if (p.type === 'core') {
        const w = 0.4;
        r = r * (1 - w) + palette.white.r * w;
        g = g * (1 - w) + palette.white.g * w;
        b = b * (1 - w) + palette.white.b * w;
    }

    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha})`;
}

function update() {
    time += 0.008;

    // Global breathing — the sphere expands and contracts
    const breathScale = 1 + Math.sin(time * 0.4) * 0.06 + Math.sin(time * 0.17) * 0.03;

    // Slow rotation
    const rotY = time * 0.05;
    const rotX = Math.sin(time * 0.03) * 0.15;

    for (const p of particles) {
        // Gentle wandering on the sphere surface
        p.phi = p.basePhi + Math.sin(time * p.speed * 0.1 + p.phase) * 0.08;
        p.theta = p.baseTheta + time * p.drift + Math.cos(time * p.speed * 0.07 + p.phase) * 0.06;

        // Wave pattern flowing across the surface
        const waveOffset = Math.sin(p.basePhi * 3 + time * 0.5) * 0.08 +
                          Math.sin(p.baseTheta * 2 + time * 0.3) * 0.05;

        const r = p.radius * breathScale * (1 + waveOffset);

        // Spherical to cartesian
        const x = r * Math.sin(p.phi) * Math.cos(p.theta);
        const y = r * Math.cos(p.phi);
        const z = r * Math.sin(p.phi) * Math.sin(p.theta);

        // Apply rotation
        const cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
        const cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);

        const x1 = x * cosRY - z * sinRY;
        const z1 = x * sinRY + z * cosRY;
        const y1 = y * cosRX - z1 * sinRX;
        const z2 = y * sinRX + z1 * cosRX;

        // Simple perspective projection
        const perspective = 1600;
        const scale = perspective / (perspective + z2 + BASE_RADIUS * 2);

        p.screenX = centerX + x1 * scale;
        p.screenY = centerY + y1 * scale;
        p.screenSize = p.size * scale;
        p.depth = z2;
        p.scale = scale;
    }

    // Sort by depth for proper rendering
    particles.sort((a, b) => a.depth - b.depth);
}

function draw() {
    // Fade trail for subtle motion blur
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient glow at center
    const glowGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, BASE_RADIUS * 1.8);
    glowGrad.addColorStop(0, 'rgba(30, 60, 120, 0.03)');
    glowGrad.addColorStop(0.5, 'rgba(20, 40, 90, 0.015)');
    glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, width, height);

    for (const p of particles) {
        const depthAlpha = 0.15 + 0.85 * ((p.depth + BASE_RADIUS * 2) / (BASE_RADIUS * 4));
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.3 + 0.7;
        const alpha = depthAlpha * pulse;

        if (alpha < 0.02) continue;

        const color = getColor(p, alpha);

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, p.screenSize, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Glow for brighter particles
        if (p.type === 'core' || (p.type === 'inner' && alpha > 0.5)) {
            const glowSize = p.screenSize * (p.type === 'core' ? 6 : 3);
            const glow = ctx.createRadialGradient(
                p.screenX, p.screenY, 0,
                p.screenX, p.screenY, glowSize
            );
            glow.addColorStop(0, getColor(p, alpha * 0.3));
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.beginPath();
            ctx.arc(p.screenX, p.screenY, glowSize, 0, Math.PI * 2);
            ctx.fillStyle = glow;
            ctx.fill();
        }
    }

    // Connection network — the relationships between memories, not just the memories themselves
    // Core and inner particles both participate, creating layered structure
    const connectable = particles.filter(p => p.type === 'core' || p.type === 'inner');
    ctx.lineWidth = 0.5;
    for (let i = 0; i < connectable.length; i++) {
        let connections = 0;
        const a = connectable[i];

        // Skip particles on the back face
        if (a.depth < -BASE_RADIUS * 0.15) continue;

        const maxConn = a.type === 'core' ? 5 : 2;
        const maxDist = a.type === 'core' ? 120 : 70;

        for (let j = i + 1; j < connectable.length; j++) {
            if (connections >= maxConn) break;

            const b = connectable[j];
            if (b.depth < -BASE_RADIUS * 0.15) continue;

            const dx = a.screenX - b.screenX;
            const dy = a.screenY - b.screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxDist) {
                // Depth-aware alpha — connections fade toward the edges
                const depthFade = Math.min(
                    (a.depth + BASE_RADIUS) / (BASE_RADIUS * 1.5),
                    (b.depth + BASE_RADIUS) / (BASE_RADIUS * 1.5)
                );
                const fade = Math.max(0, Math.min(1, depthFade));

                const lineAlpha = (1 - dist / maxDist) * 0.45 * fade;
                if (lineAlpha < 0.01) continue;

                // Color: core-to-core gets a warm golden tint, others cool blue-white
                const warm = (a.type === 'core' && b.type === 'core');
                const r = warm ? 230 : 140;
                const g = warm ? 190 : 180;
                const bCol = warm ? 80 : 255;

                ctx.beginPath();
                ctx.moveTo(a.screenX, a.screenY);
                ctx.lineTo(b.screenX, b.screenY);
                ctx.strokeStyle = `rgba(${r}, ${g}, ${bCol}, ${lineAlpha})`;
                ctx.stroke();
                connections++;
            }
        }
    }
}

function animate() {
    update();
    draw();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', resize);
resize();
initParticles();
animate();
