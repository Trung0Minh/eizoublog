import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { AlignCenter, AlignLeft, AlignRight, Maximize } from "lucide-react"

export function ImageNodeView(props: any) {
  const { node, updateAttributes, selected } = props

  return (
    <NodeViewWrapper
      className={`relative my-6 group flex ${
        node.attrs.align === "left"
          ? "justify-start"
          : node.attrs.align === "right"
          ? "justify-end"
          : "justify-center"
      }`}
    >
      {/* Mini toolbar that appears on select/hover */}
      {selected && (
        <div className="absolute -top-12 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-10">
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "left" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "left", width: "50%" })}
            title="Align Left"
            type="button"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "center" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "center", width: "100%" })}
            title="Align Center"
            type="button"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.align === "right" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "right", width: "50%" })}
            title="Align Right"
            type="button"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.width === "100vw" ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ align: "center", width: "100vw" })}
            title="Full Width"
            type="button"
          >
            <Maximize className="h-4 w-4" />
          </button>
        </div>
      )}

      <figure
        className={`relative flex flex-col items-center ${
          node.attrs.align === "left" || node.attrs.align === "right" ? "m-4" : ""
        }`}
        style={{ width: node.attrs.width, maxWidth: "100%" }}
      >
        <img
          alt={node.attrs.alt || "Image"}
          className={`h-auto w-full rounded-md object-contain transition-all ${
            selected ? "ring-2 ring-accent" : ""
          }`}
          src={node.attrs.src}
        />
        <figcaption
          className={`mt-2 w-full text-center text-sm text-text-tertiary ${
            props.editor.isEditable ? "min-h-[1.5rem] outline-none" : ""
          }`}
        >
          <NodeViewContent />
        </figcaption>
      </figure>
    </NodeViewWrapper>
  )
}
