import { CursorLabel } from "@/components/motion/cursor-label"
import { Parallax } from "@/components/motion/parallax"
import { DashboardPreview } from "./dashboard-preview"

/** "Fig. 1": the overview screen of the demo, as a plate in the story. */
export function PreviewPlate() {
  return (
    <section aria-labelledby="preview-title" className="overflow-x-clip border-t border-border py-20 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-12 lg:gap-6 lg:px-12">
        <div className="lg:col-span-3 lg:pt-10">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">Fig. 1</p>
          <h2 id="preview-title" className="mt-3 font-display text-3xl leading-[1.02] font-bold tracking-[-0.03em]">
            The same month, inside the demo.
          </h2>
          <p data-animate="" className="reveal mt-4 max-w-xs text-[0.95rem] leading-relaxed text-muted-foreground">
            The overview screen: income against spending, the tax set aside, and every transaction sorted with its
            reason. Click it to open the real thing.
          </p>
        </div>
        <div className="lg:col-span-9">
          <Parallax offset={90} rotate={-1.5}>
            <CursorLabel label="Open demo ↗">
              <DashboardPreview />
            </CursorLabel>
          </Parallax>
        </div>
      </div>
    </section>
  )
}
