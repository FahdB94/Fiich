import { cn } from "@/lib/utils"

interface FiichLogoProps {
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
}

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8", 
  lg: "w-12 h-12",
  xl: "w-16 h-16"
}

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl", 
  xl: "text-3xl"
}

export function FiichLogo({ className, size = "md", showText = true }: FiichLogoProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {/* Logo Icon */}
      <div className={cn(sizeClasses[size], "relative flex-shrink-0")}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Document background */}
          <rect 
            x="10" 
            y="10" 
            width="60" 
            height="80" 
            rx="8" 
            ry="8" 
            className="fill-[#4785FF]"
          />
          
          {/* Document lines */}
          <rect x="18" y="25" width="30" height="3" rx="1.5" className="fill-white/80" />
          <rect x="18" y="35" width="25" height="2" rx="1" className="fill-white/60" />
          <rect x="18" y="42" width="35" height="2" rx="1" className="fill-white/60" />
          <rect x="18" y="49" width="20" height="2" rx="1" className="fill-white/60" />
          
          {/* Checkmark circle */}
          <circle 
            cx="75" 
            cy="35" 
            r="18" 
            className="fill-[#4ADE80]"
          />
          
          {/* Checkmark */}
          <path 
            d="M68 35l5 5 10-10" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none"
          />
        </svg>
      </div>
      
      {/* Brand Text */}
      {showText && (
        <span className={cn(
          "font-bold text-foreground tracking-tight",
          textSizeClasses[size]
        )}>
          Fiich
        </span>
      )}
    </div>
  )
}

export function FiichIcon({ className, size = "md" }: Omit<FiichLogoProps, 'showText'>) {
  return <FiichLogo className={className} size={size} showText={false} />
}