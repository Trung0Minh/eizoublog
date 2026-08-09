import type { JSONContent } from "@tiptap/react"
import type { CSSProperties, ReactNode } from "react"

import {
  galleryRowHasCaption,
  getGalleryImageAlt,
  getGalleryImagePresentation,
  groupGalleryImagesIntoRows,
  normalizeGalleryLayout,
  parseGalleryImages,
} from "@/components/editor/gallery"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"
import { SpoilerBlock } from "@/components/posts/SpoilerBlock"
import {
  getMediaPresentation,
  getNativeVideoFrameStyle,
  positiveMediaDimension,
} from "@/lib/mediaPresentation"
import { normalizePostHeadingIds } from "@/lib/postHeadings"
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

function booleanAttr(attrs: Record<string, unknown>, name: string) {
  const value = attrs[name]
  return value === true || value === "true"
}

function textAlignStyle(value: string | undefined): CSSProperties | undefined {
  if (
    value === "left" ||
    value === "right" ||
    value === "center" ||
    value === "justify"
  ) {
    return { textAlign: value }
  }

  return undefined
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
      case "highlight":
        rendered = (
          <mark
            className="editor-highlight"
            key={markKey}
            style={{
              backgroundColor: stringAttr(attrs, "color") ?? "#fef08a",
            }}
          >
            {rendered}
          </mark>
        )
        break
      case "link": {
        const href = stringAttr(attrs, "href")

        if (href) {
          rendered = (
            <a
              className="font-semibold text-accent underline decoration-accent/60 decoration-[1.5px] underline-offset-[3px] transition-colors duration-150 hover:bg-accent/10 hover:decoration-accent focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              href={href}
              key={markKey}
              rel="noopener noreferrer"
              target="_blank"
            >
              {rendered}
            </a>
          )
        }
        break
      }
      case "strike":
        rendered = <s key={markKey}>{rendered}</s>
        break
      case "textStyle": {
        // Public rendering ignores saved text colors because pasted rich text can
        // carry arbitrary browser-generated colors that break light/dark themes.
        break
      }
      case "underline":
        rendered = <u key={markKey}>{rendered}</u>
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
  const { imageStyle, rotation, wrapperStyle } = getMediaPresentation(attrs)
  const naturalWidth = positiveMediaDimension(attrs.naturalWidth)
  const naturalHeight = positiveMediaDimension(attrs.naturalHeight)

  const alignClass = align === "left"
    ? "float-left mr-6 mb-4 mt-2 clear-left"
    : align === "right"
    ? "float-right ml-6 mb-4 mt-2 clear-right"
    : "justify-center my-2 clear-both"

  return (
    <figure 
      className={`relative flex flex-col items-center ${alignClass}`} 
      data-align={align}
      data-type="image" 
      key={key}
      style={{
        width: align !== "center" ? width : "100%",
        maxWidth: "100%",
      }}
    >
      <div className="w-full" style={wrapperStyle}>
        <img
          alt={stringAttr(attrs, "alt") || caption || ""}
          className="!m-0 h-auto w-full rounded-md object-contain"
          data-flip-x={booleanAttr(attrs, "flipX") ? "true" : "false"}
          data-flip-y={booleanAttr(attrs, "flipY") ? "true" : "false"}
          data-image-rotation={rotation}
          data-natural-height={naturalHeight ?? undefined}
          data-natural-width={naturalWidth ?? undefined}
          decoding="async"
          loading="lazy"
          src={src}
          style={imageStyle}
        />
      </div>
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
  const layout = normalizeGalleryLayout(attrs.layout)
  const galleryCaption = stringAttr(attrs, "caption") ?? ""
  const showGalleryCaption = attrs.showCaption === true && galleryCaption.trim() !== ""

  if (images.length === 0) {
    return null
  }

  if (images.length === 1) {
    const [image] = images

    return renderImage(
      {
        attrs: {
          align: "center",
          alt: getGalleryImageAlt(image),
          flipX: image.flipX,
          flipY: image.flipY,
          naturalHeight: image.naturalHeight,
          naturalWidth: image.naturalWidth,
          rotation: image.rotation,
          showCaption: image.showCaption,
          src: image.url,
          width: "100%",
        },
        content: image.caption
          ? [{ text: image.caption, type: "text" }]
          : undefined,
        type: "customImage",
      },
      key,
    )
  }

  const galleryRows = layout === "grid"
    ? groupGalleryImagesIntoRows(images, columns)
    : [images.map((image, index) => ({ image, index }))]

  return (
    <div
      className="image-gallery"
      data-layout={layout}
      data-type="image-gallery"
      key={key}
    >
      <div
        className={
          layout === "horizontal"
            ? "image-gallery__horizontal"
            : "image-gallery__grid"
        }
      >
        {galleryRows.map((row, rowIndex) => (
          <div
            className="image-gallery__grid-row"
            key={rowIndex}
            style={layout === "grid" ? { gridTemplateColumns: `repeat(${Math.min(columns, images.length)}, minmax(0, 1fr))` } : undefined}
          >
          {row.map(({ image, index }) => {
          const isNative = isNativeVideo(image.url)
          const isVideoUrl = isNative || image.url.includes("youtube.com") || image.url.includes("youtu.be")
          const showCaption = image.caption.trim() && image.showCaption !== false
          const reserveCaptionSpace = layout === "grid" && !showCaption && galleryRowHasCaption(images, index, columns)
          const { transform, wrapperAspectRatio } = getGalleryImagePresentation(image)

          return (
            <figure className="image-gallery__item" key={image.url + index}>
              {isVideoUrl ? (
                isNative ? (
                  <div
                    className="relative w-full overflow-hidden rounded-md bg-black/5"
                    data-native-video-frame
                    style={getNativeVideoFrameStyle(image)}
                  >
                    <video
                      className="absolute inset-0 h-full w-full rounded-md object-contain"
                      controls
                      data-native-video
                      preload="metadata"
                      src={image.url}
                      title={getGalleryImageAlt(image)}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-video w-full">
                    <iframe
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full rounded-md"
                      loading="lazy"
                      src={toVideoEmbedUrl(image.url)}
                      title={getGalleryImageAlt(image)}
                    />
                  </div>
                )
              ) : (
                <div className="flex w-full items-center justify-center overflow-hidden" style={wrapperAspectRatio ? { aspectRatio: wrapperAspectRatio } : undefined}>
                  <img
                    alt={getGalleryImageAlt(image)}
                    className="image-gallery__image"
                    decoding="async"
                    loading="lazy"
                    src={image.url}
                    style={{ transform, transformOrigin: "center" }}
                  />
                </div>
              )}
              {showCaption ? (
                <figcaption className="image-gallery__caption">
                  {image.caption}
                </figcaption>
              ) : reserveCaptionSpace ? (
                <figcaption aria-hidden="true" className="image-gallery__caption image-gallery__caption--placeholder" />
              ) : null}
            </figure>
          )
          })}
          </div>
        ))}
      </div>
      {showGalleryCaption ? (
        <p className="image-gallery__gallery-caption mt-2 text-center text-sm">
          {galleryCaption}
        </p>
      ) : null}
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
    <figure className="my-2" data-type="video-embed" key={key}>
      {isNativeVideo(rawUrl) ? (
        <div
          className="relative w-full overflow-hidden rounded-md bg-black/5"
          data-native-video-frame
          style={getNativeVideoFrameStyle(attrs)}
        >
          <video
            className="absolute inset-0 h-full w-full rounded-md object-contain"
            controls
            data-native-video
            preload="metadata"
            src={rawUrl}
            title={caption || "Embedded video"}
          />
        </div>
        ) : (
          <div className="relative aspect-video w-full">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full rounded-md"
            loading="lazy"
            src={toVideoEmbedUrl(rawUrl)}
            title={caption || "Embedded video"}
          />
          </div>
        )}
      {caption && captionIsVisible(attrs) ? (
        <figcaption className="media-caption">{caption}</figcaption>
      ) : null}
    </figure>
  )
}

function renderNode(node: JSONContent, key: string): ReactNode {
  const attrs = attrsFor(node)
  const alignStyle = textAlignStyle(stringAttr(attrs, "textAlign"))

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
      const level = numberAttr(attrs, "level")
      const Tag = level === 3 ? "h3" : level === 4 ? "h4" : "h2"
      const text = getNodeText(node).trim()

      const id = stringAttr(attrs, "id") ?? (text ? generateSlug(text) : undefined)

      return (
        <Tag className="scroll-mt-24" id={id} key={key} style={alignStyle}>
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
      const start = numberAttr(attrs, "start")
      return (
        <ol key={key} start={start}>
          {renderChildren(node)}
        </ol>
      )
    }
    case "paragraph": {
      const children = renderChildren(node)
      const isEmpty = children.length === 0

      return (
        <p data-empty={isEmpty ? "true" : undefined} key={key} style={alignStyle}>
          {isEmpty ? <br /> : children}
        </p>
      )
    }
    case "spoiler":
      return <SpoilerBlock key={key}>{renderChildren(node)}</SpoilerBlock>
    case "text":
      return renderTextNode(node, key)
    case "taskItem": {
      const checked = attrs.checked === true
      return (
        <li className="task-item" data-checked={checked} key={key}>
          <label contentEditable={false}>
            <input checked={checked} disabled type="checkbox" />
          </label>
          <div>{renderChildren(node)}</div>
        </li>
      )
    }
    case "taskList":
      return (
        <ul className="task-list" data-type="taskList" key={key}>
          {renderChildren(node)}
        </ul>
      )
    case "videoEmbed":
      return renderVideoEmbed(node, key)
    default: {
      const children = renderChildren(node)
      return children.length > 0 ? <span key={key}>{children}</span> : null
    }
  }
}

export function StaticPostContent({
  content,
  presentation = "article",
}: {
  content: JSONContent
  presentation?: "article" | "embedded"
}) {
  if (presentation === "embedded") {
    return (
      <div className="ProseMirror">
        {renderChildren(normalizePostHeadingIds(content))}
      </div>
    )
  }

  return (
    <div className="ProseMirror post-rich-text">
      {renderChildren(normalizePostHeadingIds(content))}
    </div>
  )
}
