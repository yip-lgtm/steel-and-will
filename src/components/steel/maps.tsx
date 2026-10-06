export function TheaterMap({ theater }: { theater: string }) {
  const land = "#c4b48a";
  const line = "#efe6cf";
  const sea = "none";
  if (theater === "北海") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="北海">
        <rect width="100" height="100" fill={sea} />
        <path d="M6 8 L16 4 L20 12 L14 18 L18 28 L12 40 L16 54 L10 70 L6 62 L8 36 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M18 6 L22 4 L21 9 Z" fill={land} />
        <path d="M74 2 L90 4 L86 24 L78 16 L74 6 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M68 34 L78 30 L84 46 L76 72 L66 60 L70 44 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M58 78 L98 72 L98 100 L36 100 L46 84 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="8" y="42" fill="#1b2430" fontSize="3.2">英國</text>
        <text x="76" y="14" fill="#1b2430" fontSize="3.2">挪威</text>
        <text x="69" y="52" fill="#1b2430" fontSize="3">日德蘭</text>
      </svg>
    );
  }
  if (theater === "西線" || theater === "本土") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={theater}>
        <path d="M4 8 L18 6 L16 28 L10 46 L14 70 L6 78 L4 40 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M28 30 L98 18 L98 100 L22 100 L26 70 L34 48 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="5" y="40" fill="#1b2430" fontSize="3.2">英國</text>
        <text x="46" y="78" fill="#1b2430" fontSize="3.2">法國</text>
        <text x="60" y="36" fill="#1b2430" fontSize="3.2">比利時</text>
      </svg>
    );
  }
  if (theater === "太平洋") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="太平洋">
        <path d="M2 40 L16 36 L18 58 L8 70 L2 56 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M70 8 L98 6 L98 34 L82 28 L74 16 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <circle cx="74" cy="32" r="2.2" fill={land} />
        <circle cx="58" cy="40" r="1.4" fill={land} />
        <text x="3" y="52" fill="#1b2430" fontSize="3">夏威夷</text>
        <text x="78" y="18" fill="#1b2430" fontSize="3.2">日本</text>
      </svg>
    );
  }
  if (theater === "中國") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label="中國">
        <path d="M8 20 L70 8 L78 30 L62 48 L70 78 L20 90 L8 60 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M78 30 L98 24 L98 70 L74 62 Z" fill="#1d4e73" />
        <text x="28" y="40" fill="#1b2430" fontSize="4">華北</text>
      </svg>
    );
  }
  if (theater === "東歐" || theater === "東線") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={theater}>
        <path d="M4 16 L28 10 L36 28 L22 46 L8 40 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M30 12 L96 8 L96 92 L28 96 L34 60 L48 40 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="8" y="30" fill="#1b2430" fontSize="3">德國</text>
        <text x="52" y="36" fill="#1b2430" fontSize="3.2">波蘭</text>
        <text x="62" y="68" fill="#1b2430" fontSize="3.2">烏克蘭</text>
      </svg>
    );
  }
  if (theater === "戰後" || theater === "冷戰") {
    return (
      <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={theater}>
        <path d="M8 20 L34 16 L36 40 L18 48 L8 36 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M42 14 L78 10 L80 42 L50 48 L44 28 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <path d="M18 62 L70 58 L74 90 L16 92 Z" fill={land} stroke={line} strokeWidth="0.4" />
        <text x="14" y="34" fill="#1b2430" fontSize="3">歐洲</text>
        <text x="50" y="30" fill="#1b2430" fontSize="3">朝鮮</text>
        <text x="28" y="78" fill="#1b2430" fontSize="3">中東</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-label={theater || "現代"}>
      <path d="M6 24 L28 16 L30 42 L12 50 Z" fill={land} stroke={line} strokeWidth="0.4" />
      <path d="M40 18 L70 12 L74 46 L42 50 Z" fill={land} stroke={line} strokeWidth="0.4" />
      <path d="M16 62 L62 58 L66 90 L14 92 Z" fill={land} stroke={line} strokeWidth="0.4" />
      <path d="M72 60 L94 56 L96 84 L70 88 Z" fill={land} stroke={line} strokeWidth="0.4" />
      <text x="10" y="36" fill="#1b2430" fontSize="3">歐洲</text>
      <text x="48" y="32" fill="#1b2430" fontSize="3">東亞</text>
      <text x="24" y="78" fill="#1b2430" fontSize="3">中東</text>
    </svg>
  );
}
