import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { AlignCenter, AlignLeft, AlignRight, Maximize, Trash2, Type } from "lucide-react"

export function ImageNodeView(props: NodeViewProps) {
  const { node, updateAttributes, selected } = props

  return (
    <NodeViewWrapper
      as="figure"
      className={`relative group flex flex-col items-center ${
        node.attrs.align === "left"
          ? "float-left mr-6 mb-4 mt-2 clear-left"
          : node.attrs.align === "right"
          ? "float-right ml-6 mb-4 mt-2 clear-right"
          : "justify-center my-6 clear-both"
      }`}
      style={{
        width: node.attrs.align !== "center" ? node.attrs.width : "100%",
        maxWidth: "100%",
      }}
    >
      {/* Mini toolbar that appears on select/hover */}
      {props.editor.isEditable && (
        <div className={`absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 transition-opacity duration-200 ${selected ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
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

          <div className="mx-1 h-4 w-px bg-border-default" />
          <button
            className={`rounded p-1.5 text-sm hover:bg-subtle-bg ${
              node.attrs.showCaption ? "bg-subtle-bg text-text-primary" : "text-text-secondary"
            }`}
            onClick={() => updateAttributes({ showCaption: !node.attrs.showCaption })}
            title="Toggle Caption"
            type="button"
          >
            <Type className="h-4 w-4" />
          </button>
          <div className="mx-1 h-4 w-px bg-border-default" />

          <button
            className="rounded p-1.5 text-sm text-red-500 hover:bg-red-500/10"
            onClick={() => props.deleteNode()}
            title="Delete Image"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

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
        } ${!node.attrs.showCaption && node.content.size === 0 ? "hidden" : ""}`}
      >
        <NodeViewContent />
      </figcaption>
    </NodeViewWrapper>
  )
}
