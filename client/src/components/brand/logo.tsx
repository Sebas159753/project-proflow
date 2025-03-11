import { FC } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo exterior - representa el tiempo */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" className="text-primary"/>

      {/* Marca de tiempo - representa progreso */}
      <path
        d="M20 8 L20 20 L28 24"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-primary"
      />

      {/* Punto central */}
      <circle cx="20" cy="20" r="2" fill="currentColor" className="text-primary"/>

      {/* Marcas de horas */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line
          key={i}
          x1="20"
          y1="4"
          x2="20"
          y2="7"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          transform={`rotate(${i * 60} 20 20)`}
        />
      ))}
    </svg>
  );
};

export const LogoWithText: FC<LogoProps> = ({ className = "", size = 40 }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Logo size={size} />
      <span className="font-bold text-xl">DataFocus</span>
    </div>
  );
};