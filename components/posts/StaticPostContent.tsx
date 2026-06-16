import type { JSONContent } from "@tiptap/react"
import type { ReactNode } from "react"

import {
  getGalleryImageAlt,
  parseGalleryImages,
} from "@/components/editor/gallery"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"
import { SpoilerBlock } from "@/components/posts/SpoilerBlock"
import { generateSlug } from "@/lib/utils"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function attrsFor(node: JSONContent) {
  return isRecord(node.attrs) ? node.attrs : {}
}

function stringAttr(
  attrs: Record<string, unknown>,
  name: string,
): string | undefined {
  const value = attrs[name]
  return typeof value === "string" ? value : undefined
}

function numberAttr(
  attrs: Record<string, unknown>,
  name: string,
): number | undefined {
  const value = attrs[name]
  return typeof value === "number" ? value : undefined
}

function captionIsVisible(attrs: Record<string, unknown>) {
  const value = attrs.showCaption
  return value !== false && value !== "false"
}

function getNodeText(node: JSONContent): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  return node.content?.map(getNodeText).join("") ?? ""
}

function renderChildren(node: JSONContent): ReactNode[] {
  return (
    node.content?.map((child, index) => renderNode(child, `child-${index}`)) ??
    []
  )
}

function renderTextNode(node: JSONContent, key: string): ReactNode {
  let rendered: ReactNode = node.text ?? ""

  node.marks?.forEach((mark, index) => {
    const markKey = `${key}-mark-${index}`
    const attrs = isRecord(mark.attrs) ? mark.attrs : {}

    switch (mark.type) {
      case "bold":
        rendered = <strong key={markKey}>{rendered}</strong>
        break
      case "code":
        rendered = <code key={markKey}>{rendered}</code>
        break
      case "italic":
        rendered = <em key={markKey}>{rendered}</em>
        break
      case "link": {
        const href = stringAttr(attrs, "href")
        if (href) {
          rendered = (
            <a href={href} key={markKey} rel="noopener noreferrer" target="_blank">
              {rendered}
            </a>
          )
        }
        break
      }
      case "strike":
        rendered = <s key={markKey}>{rendered}</s>
        break
    }
  })

  return rendered
}

function renderImage(node: JSONContent, key: string) {
  const attrs = attrsFor(node)
  const src = stringAttr(attrs, "src")

  if (!src) {
    return null
  }

  const caption = getNodeText(node)
  const align = stringAttr(attrs, "align") || "center"
  const width = stringAttr(attrs, "width") || "100%"

  const alignClass = align === "left"
    ? "float-left mr-6 mb-4 mt-2 clear-left"
    : align === "right"
    ? "float-right ml-6 mb-4 mt-2 clear-right"
    : "justify-center my-6 clear-both"

  return (
    <figure 
      className={`relative flex flex-col items-center ${alignClass}`} 
      data-type="image" 
      key={key}
      style={{
        width: align !== "center" ? width : "100%",
        maxWidth: "100%",
      }}
    >
      <img
        alt={stringAttr(attrs, "alt") || caption || ""}
        className="!m-0 h-auto w-full rounded-md object-contain"
        decoding="async"
        loading="lazy"
        src={src}
      />
      {caption && captionIsVisible(attrs) ? (
        <figcaption className="media-caption">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

function renderImageGallery(node: JSONContent, key: string) {
  const attrs = attrsFor(node)
  const images = parseGalleryImages(attrs.images)
  const columns = numberAttr(attrs, "columns") || 2

  if (images.length === 0) {
    return null
  }

  return (
    <div className="image-gallery" data-type="image-gallery" key={key}>
      <div className="image-gallery__grid" style={{ gridTemplateColumns: `repeat(${Math.min(columns, images.length)}, minmax(0, 1fr))` }}>
        {images.map((image, index) => {
          const isNative = isNativeVideo(image.url)
          const isVideoUrl = isNative || image.url.includes("youtube.com") || image.url.includes("youtu.be")

          return (
            <figure className="image-gallery__item" key={image.url + index}>
              {isVideoUrl ? (
                <div className="relative w-full h-full aspect-video">
                  {isNative ? (
                    <video
                      className="absolute inset-0 h-full w-full rounded-md object-contain bg-black/5"
                      controls
                      preload="metadata"
                      src={image.url}
                      title={getGalleryImageAlt(image)}
                    />
                  ) : (
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full rounded-md"
                      loading="lazy"
                      src={toVideoEmbedUrl(image.url)}
                      title={getGalleryImageAlt(image)}
                    />
                  )}
                </div>
              ) : (
                <img
                  alt={getGalleryImageAlt(image)}
                  className="image-gallery__image"
                  decoding="async"
                  loading="lazy"
                  src={image.url}
                />
              )}
              {image.caption && image.showCaption !== false ? (
                <figcaption className="image-gallery__caption">
                  {image.caption}
                </figcaption>
              ) : null}
            </figure>
          )
        })}
      </div>
    </div>
  )
}

function renderVideoEmbed(node: JSONContent, key: string) {
  const attrs = attrsFor(node)
  const rawUrl = stringAttr(attrs, "url")

  if (!rawUrl) {
    return null
  }

  const caption = stringAttr(attrs, "caption") ?? ""

  return (
    <figure className="my-6" data-type="video-embed" key={key}>
      <div className="relative aspect-video w-full">
        {isNativeVideo(rawUrl) ? (
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
      {caption && captionIsVisible(attrs) ? (
        <figcaption className="media-caption">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

function renderNode(node: JSONContent, key: string): ReactNode {
  switch (node.type) {
    case "blockquote":
      return <blockquote key={key}>{renderChildren(node)}</blockquote>
    case "bulletList":
      return <ul key={key}>{renderChildren(node)}</ul>
    case "codeBlock":
      return (
        <pre key={key}>
          <code>{getNodeText(node)}</code>
        </pre>
      )
    case "doc":
      return <>{renderChildren(node)}</>
    case "hardBreak":
      return <br key={key} />
    case "heading": {
      const level = numberAttr(attrsFor(node), "level")
      const Tag = level === 3 ? "h3" : level === 4 ? "h4" : "h2"
      const text = getNodeText(node).trim()

      return (
        <Tag id={text ? generateSlug(text) : undefined} key={key}>
          {renderChildren(node)}
        </Tag>
      )
    }
    case "horizontalRule":
      return <hr key={key} />
    case "image":
    case "customImage":
      return renderImage(node, key)
    case "imageGallery":
      return renderImageGallery(node, key)
    case "listItem":
      return <li key={key}>{renderChildren(node)}</li>
    case "orderedList": {
      const start = numberAttr(attrsFor(node), "start")
      return (
        <ol key={key} start={start}>
          {renderChildren(node)}
        </ol>
      )
    }
    case "paragraph": {
      const children = renderChildren(node)
      return (
        <p key={key}>
          {children.length > 0 ? children : <br />}
        </p>
      )
    }
    case "spoiler":
      return <SpoilerBlock key={key}>{renderChildren(node)}</SpoilerBlock>
    case "text":
      return renderTextNode(node, key)
    case "videoEmbed":
      return renderVideoEmbed(node, key)
    default: {
      const children = renderChildren(node)
      return children.length > 0 ? <span key={key}>{children}</span> : null
    }
  }
}

export function StaticPostContent({ content }: { content: JSONContent }) {
  return <div className="ProseMirror">{renderChildren(content)}</div>
}
