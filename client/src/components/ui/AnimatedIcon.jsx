import React from 'react';
import { FiEdit2 } from 'react-icons/fi';
import { darkTheme as t } from './theme';

// Íconos animados (success, warning, error, info) estilo SweetAlert usando SVG + SMIL (sin CSS externo)
export default function AnimatedIcon({ type = 'info', size = 64, strokeWidth = 5 }) {
	// Animación de entrada y pequeño wiggle para 'edit'
	const [phase, setPhase] = React.useState(0); // 0: pre, 1: pop-in, 2: wiggle, 3: settle
	React.useEffect(() => {
		const a = setTimeout(() => setPhase(1), 0);
		const b = setTimeout(() => setPhase(2), 380);
		const c = setTimeout(() => setPhase(3), 560);
		return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
	}, []);
	const colors = {
		success: '#22c55e',
		warning: '#f59e0b',
		error: '#ef4444',
		info: '#3b82f6',
		plus: t.accent,
		edit: t.accent,
	};
	const color = colors[type] || t.text900;
	const sw = strokeWidth;
	const half = size / 2;
	const r = half - sw;

		if (type === 'edit') {
			const transform = phase === 0
				? 'scale(0.9) rotate(-6deg)'
				: phase === 1
				? 'scale(1) rotate(0deg)'
				: phase === 2
				? 'scale(1) rotate(3deg)'
				: 'scale(1) rotate(0deg)';
			const base = {
				position: 'relative',
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'center',
				color: t.accent,
				transform,
				opacity: phase > 0 ? 1 : 0,
				transition: 'transform 260ms ease-out, opacity 360ms ease-out',
				willChange: 'transform, opacity',
			};
			const scribbleW = Math.max(24, Math.floor(size * 0.56));
			const scribbleStyle = {
				position: 'absolute',
				left: Math.floor(size * 0.22),
				bottom: -Math.floor(size * 0.06),
			};
			return (
				<span style={base} aria-hidden>
					<FiEdit2 size={size} />
					{/* línea de "escritura" animada */}
					<svg width={scribbleW} height={8} style={scribbleStyle} viewBox={`0 0 ${scribbleW} 8`} fill="none">
						<line x1={0} y1={4} x2={scribbleW} y2={4} stroke={t.accent} strokeWidth={Math.max(2, strokeWidth * 0.6)} strokeLinecap="round"
							strokeDasharray="60" strokeDashoffset="60">
							<animate attributeName="stroke-dashoffset" from="60" to="0" dur="420ms" begin="160ms" fill="freeze" />
						</line>
					</svg>
				</span>
			);
		}

	if (type === 'success') {
		return (
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
				<circle cx={half} cy={half} r={r} stroke={color} strokeWidth={sw} strokeLinecap="round"
					strokeDasharray={Math.PI * 2 * r} strokeDashoffset={Math.PI * 2 * r}>
					<animate attributeName="stroke-dashoffset" from={Math.PI * 2 * r} to="0" dur="300ms" fill="freeze" />
					<animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
				</circle>
				<path d={`M ${size*0.28} ${half} L ${size*0.45} ${size*0.62} L ${size*0.74} ${size*0.36}`}
					stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" fill="none"
					strokeDasharray="60" strokeDashoffset="60">
					<animate attributeName="stroke-dashoffset" from="60" to="0" dur="300ms" begin="120ms" fill="freeze" />
				</path>
			</svg>
		);
	}

	if (type === 'error') {
		return (
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
				<circle cx={half} cy={half} r={r} stroke={color} strokeWidth={sw} strokeLinecap="round"
					strokeDasharray={Math.PI * 2 * r} strokeDashoffset={Math.PI * 2 * r}>
					<animate attributeName="stroke-dashoffset" from={Math.PI * 2 * r} to="0" dur="300ms" fill="freeze" />
					<animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
				</circle>
				<path d={`M ${size*0.32} ${size*0.32} L ${size*0.68} ${size*0.68}`} stroke={color} strokeWidth={sw} strokeLinecap="round"
					strokeDasharray="60" strokeDashoffset="60">
					<animate attributeName="stroke-dashoffset" from="60" to="0" dur="280ms" begin="120ms" fill="freeze" />
				</path>
				<path d={`M ${size*0.68} ${size*0.32} L ${size*0.32} ${size*0.68}`} stroke={color} strokeWidth={sw} strokeLinecap="round"
					strokeDasharray="60" strokeDashoffset="60">
					<animate attributeName="stroke-dashoffset" from="60" to="0" dur="280ms" begin="160ms" fill="freeze" />
				</path>
			</svg>
		);
	}

	if (type === 'warning') {
		// Triángulo con línea + punto amarillo (sin punto negro arriba)
		const xTop = half, yTop = sw;
		const xL = sw, yB = size - sw;
		const xR = size - sw;
		const xM = half; // punto medio de la base
		// Empezamos el trazo en el medio de la base para que la unión no quede en un vértice
		const dTri = `M ${xM} ${yB} L ${xR} ${yB} L ${xTop} ${yTop} L ${xL} ${yB} L ${xM} ${yB}`;
		const clipId = `clipWarn-${Math.random().toString(36).slice(2)}`;
		return (
			<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
				<defs>
					<clipPath id={clipId}>
						<path d={dTri} />
					</clipPath>
				</defs>
				<path d={dTri} stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" fill="none"
					strokeDasharray="300" strokeDashoffset="300">
					<animate attributeName="stroke-dashoffset" from="300" to="0" dur="320ms" fill="freeze" />
					<animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
				</path>
				<g clipPath={`url(#${clipId})`}>
					<line x1={half} y1={size*0.38} x2={half} y2={size*0.6} stroke={color} strokeWidth={sw} strokeLinecap="round"
						strokeDasharray="40" strokeDashoffset="40">
						<animate attributeName="stroke-dashoffset" from="40" to="0" dur="260ms" begin="120ms" fill="freeze" />
					</line>
					{/* punto amarillo del signo de exclamación */}
					<circle cx={half} cy={size*0.75} r={sw/2} fill={color} opacity="0">
						<animate attributeName="opacity" from="0" to="1" dur="180ms" begin="220ms" fill="freeze" />
					</circle>
				</g>
			</svg>
		);
	}

	// info: círculo + "i"
	return (
		<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
			<circle cx={half} cy={half} r={r} stroke={color} strokeWidth={sw} strokeLinecap="round"
				strokeDasharray={Math.PI * 2 * r} strokeDashoffset={Math.PI * 2 * r}>
				<animate attributeName="stroke-dashoffset" from={Math.PI * 2 * r} to="0" dur="300ms" fill="freeze" />
				<animateTransform attributeName="transform" type="scale" from="0.9 0.9" to="1 1" dur="200ms" additive="sum" />
			</circle>
			{/* rama vertical (info y plus comparten estructura; en info es la letra i) */}
			<line x1={half} y1={size*0.42} x2={half} y2={size*0.62} stroke={color} strokeWidth={sw} strokeLinecap="round"
				strokeDasharray="40" strokeDashoffset="40">
				<animate attributeName="stroke-dashoffset" from="40" to="0" dur="260ms" begin="120ms" fill="freeze" />
			</line>
			{type === 'info' && (
				<circle cx={half} cy={size*0.28} r={sw/2} fill={color} opacity="0">
					<animate attributeName="opacity" from="0" to="1" dur="180ms" begin="220ms" fill="freeze" />
				</circle>
			)}
			{type === 'plus' && (
				// rama horizontal del +, animada
				<line x1={size*0.38} y1={half} x2={size*0.62} y2={half} stroke={color} strokeWidth={sw} strokeLinecap="round"
					strokeDasharray="40" strokeDashoffset="40">
					<animate attributeName="stroke-dashoffset" from="40" to="0" dur="260ms" begin="160ms" fill="freeze" />
				</line>
			)}
			{type === 'edit' && (
				// lápiz diagonal simple: cuerpo + puntita + borrador
				<g>
					<line x1={size*0.40} y1={size*0.58} x2={size*0.62} y2={size*0.36} stroke={color} strokeWidth={sw} strokeLinecap="round"
						strokeDasharray="60" strokeDashoffset="60">
						<animate attributeName="stroke-dashoffset" from="60" to="0" dur="300ms" begin="120ms" fill="freeze" />
					</line>
					<line x1={size*0.62} y1={size*0.36} x2={size*0.66} y2={size*0.32} stroke={color} strokeWidth={sw*0.7} strokeLinecap="round"
						strokeDasharray="20" strokeDashoffset="20">
						<animate attributeName="stroke-dashoffset" from="20" to="0" dur="220ms" begin="200ms" fill="freeze" />
					</line>
					<line x1={size*0.38} y1={size*0.60} x2={size*0.34} y2={size*0.64} stroke={color} strokeWidth={sw*0.9} strokeLinecap="round"
						strokeDasharray="20" strokeDashoffset="20">
						<animate attributeName="stroke-dashoffset" from="20" to="0" dur="220ms" begin="220ms" fill="freeze" />
					</line>
				</g>
			)}
		</svg>
	);
}
