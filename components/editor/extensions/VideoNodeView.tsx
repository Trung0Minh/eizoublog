import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react"
import { Trash2, Type } from "lucide-react"

import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

export function VideoNodeView(props: NodeViewProps) {
  const { node, selected, deleteNode, editor, updateAttributes } = props

  const rawUrl = typeof node.attrs.url === "string" ? node.attrs.url : ""
  const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : ""

  const isNative = isNativeVideo(rawUrl)

  return (
    <NodeViewWrapper className={`relative my-2 group ${selected ? 'ring-2 ring-accent rounded-md' : ''}`}>
      {props.editor.isEditable && (
        <div className={`absolute top-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-md border border-border-default bg-background p-1 shadow-md z-50 transition-opacity duration-200 ${selected ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
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
            onClick={() => deleteNode()}
            title="Delete Video"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      <figure className="m-0" data-type="video-embed">
        <div className="relative w-full aspect-video">
          {isNative ? (
            <video
              className="absolute inset-0 h-full w-full rounded-md object-contain bg-black/5"
              controls
              preload="metadata"
              src={rawUrl}
              title={caption || "Embedded video"}
            />
          ) : (
            <iframe
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full rounded-md"
              loading="lazy"
              src={toVideoEmbedUrl(rawUrl)}
              title={caption || "Embedded video"}
            />
          )}
        </div>
        {editor.isEditable ? (
          node.attrs.showCaption ? (
            <figcaption className="editor-media-caption mt-1 w-full text-center text-sm">
              <input
                autoFocus
                className="w-full border-none bg-transparent text-center italic outline-none placeholder:text-text-tertiary/50"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => updateAttributes({ caption: e.target.value })}
                onKeyDown={(e) => e.stopPropagation()}
              />
            </figcaption>
          ) : null
        ) : node.attrs.showCaption !== false && caption ? (
          <figcaption className="editor-media-caption mt-1 text-center text-sm">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </NodeViewWrapper>
  )
}
