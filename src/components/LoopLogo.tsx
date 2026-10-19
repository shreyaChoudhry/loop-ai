import Image from "next/image";
import Link from "next/link";

export type LoopLogoVariant = "full" | "transparent" | "icon" | "icon-transparent" | "sidebar" | "stitch-nav";

interface LoopLogoProps {
  variant?: LoopLogoVariant;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  href?: string;
  badge?: string;
  showTagline?: boolean;
}

export default function LoopLogo({
  variant = "full",
  className = "",
  priority = false,
  width,
  height,
  href,
  badge,
  showTagline = true,
}: LoopLogoProps) {
  const content = (() => {
    switch (variant) {
      case "stitch-nav":
        return (
          <div className={`flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md transition hover:border-purple-500/30 ${className}`}>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white p-0.5">
              <Image
                src="/loop-icon.png"
                alt="LOOP"
                width={20}
                height={20}
                priority={priority}
                className="h-full w-full object-contain"
              />
            </div>
            <span className="text-sm font-extrabold tracking-tight text-white">LOOP</span>
            {badge && (
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                {badge}
              </span>
            )}
          </div>
        );

      case "icon":
        return (
          <Image
            src="/loop-icon.png"
            alt="LOOP — Ideas to Insights to Impact"
            width={width || 40}
            height={height || 40}
            priority={priority}
            className={`object-contain ${className}`}
          />
        );

      case "icon-transparent":
        return (
          <Image
            src="/loop-icon-transparent.png"
            alt="LOOP — Ideas to Insights to Impact"
            width={width || 40}
            height={height || 40}
            priority={priority}
            className={`object-contain ${className}`}
          />
        );

      case "transparent":
        return (
          <Image
            src="/loop-logo-transparent.png"
            alt="LOOP — Ideas to Insights to Impact"
            width={width || 140}
            height={height || 140}
            priority={priority}
            className={`object-contain ${className}`}
          />
        );

      case "sidebar":
        return (
          <div className={`flex items-center justify-between w-full ${className}`}>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white p-1 shadow-sm transition-transform hover:scale-105">
                <Image
                  src="/loop-icon.png"
                  alt="LOOP — Ideas to Insights to Impact"
                  width={32}
                  height={32}
                  priority={priority}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-white leading-none">LOOP</span>
                {showTagline && (
                  <span className="text-[7.5px] font-semibold tracking-wider text-purple-300 uppercase mt-0.5">
                    Ideas → Insights → Impact
                  </span>
                )}
              </div>
            </div>
            {badge && (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-gray-300 border border-white/10">
                {badge}
              </span>
            )}
          </div>
        );

      case "full":
      default:
        return (
          <Image
            src="/loop-logo.png"
            alt="LOOP — Ideas to Insights to Impact"
            width={width || 140}
            height={height || 140}
            priority={priority}
            className={`object-contain ${className}`}
          />
        );
    }
  })();

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
