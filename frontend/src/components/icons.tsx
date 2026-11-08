// 白の線画アイコン（currentColor で描画）
type IconProps = { size?: number };

function Svg({ size = 24, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function HelpIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.3-2.6 3.9" />
      <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
    </Svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
    </Svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Svg>
  );
}

export function DiceIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
    </Svg>
  );
}

export function AddListIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 6h10M4 12h10M4 18h6" />
      <path d="M18 14v6M15 17h6" />
    </Svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M7.5 12.3l3 3 6-6.3" />
    </Svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M3.5 4v4h4" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 5.5l4 4" />
      <path d="M4 20l1-4.5L15.8 4.7a1.8 1.8 0 0 1 2.5 0l1 1a1.8 1.8 0 0 1 0 2.5L8.5 19z" />
    </Svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M6.5 7l.9 12.2h9.2L17.5 7" />
    </Svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 9.5l6 6 6-6" />
    </Svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Svg>
  );
}
