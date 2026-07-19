"use client"

import { Button } from "@/components/ui/button"
import { FourPointSparkle } from "@/components/ui/FourPointSparkle"
import { useParticleEffects } from "@/hooks/useParticleEffects"

export function ParticleToggle() {
  const { enabled, setEnabled } = useParticleEffects()

  return (
    <Button
      aria-label={enabled ? "Turn off particles" : "Turn on particles"}
      aria-pressed={enabled}
      className="h-8 w-8 rounded-full text-text-secondary hover:bg-subtle-bg hover:text-text-primary data-[active=true]:text-accent [&_svg]:h-[18px] [&_svg]:w-[18px]"
      data-active={enabled}
      onClick={() => setEnabled(!enabled)}
      size="icon"
      type="button"
      variant="ghost"
    >
      <FourPointSparkle className={enabled ? "sparkle-glyph" : ""} />
    </Button>
  )
}
