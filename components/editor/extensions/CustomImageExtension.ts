import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodeView } from "./ImageNodeView"

function normalizeImageRotation(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? ((value % 360) + 360) % 360
    : 0
}

function numberAttribute(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : null
}

function getRotatedImageFit(attrs: Record<string, unknown>) {
  const rotation = normalizeImageRotation(attrs.rotation)
  const naturalWidth = numberAttribute(attrs.naturalWidth)
  const naturalHeight = numberAttribute(attrs.naturalHeight)
  const isQuarterTurn = rotation === 90 || rotation === 270

  if (!isQuarterTurn || !naturalWidth || !naturalHeight) {
    return { scale: 1, wrapperStyle: "" }
  }

  return {
    scale: naturalWidth / naturalHeight,
    wrapperStyle: `align-items: center; aspect-ratio: ${naturalHeight} / ${naturalWidth}; display: flex; justify-content: center; overflow: hidden; width: 100%;`,
  }
}

function imageTransformStyle(attrs: Record<string, unknown>) {
  const rotation = normalizeImageRotation(attrs.rotation)
  const { scale } = getRotatedImageFit(attrs)
  const scaleX = attrs.flipX === true || attrs.flipX === "true" ? -1 : 1
  const scaleY = attrs.flipY === true || attrs.flipY === "true" ? -1 : 1

  return `transform: rotate(${rotation}deg) scale(${scale * scaleX}, ${scale * scaleY}); transform-origin: center;`
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: { src: string; alt?: string }) => ReturnType
    }
  }
}

export const CustomImageExtension = Node.create({
  name: "customImage",
  group: "block",
  content: "inline*",
  draggable: true,
  isolating: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      align: { default: "center" },
      width: { default: "100%" },
      showCaption: { default: false },
      rotation: {
        default: 0,
        parseHTML: (element) =>
          normalizeImageRotation(
            Number(element.getAttribute("data-rotation") ?? 0),
          ),
        renderHTML: (attributes) => ({
          "data-rotation": normalizeImageRotation(attributes.rotation),
        }),
      },
      flipX: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-flip-x") === "true",
        renderHTML: (attributes) => ({
          "data-flip-x": attributes.flipX === true ? "true" : "false",
        }),
      },
      flipY: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-flip-y") === "true",
        renderHTML: (attributes) => ({
          "data-flip-y": attributes.flipY === true ? "true" : "false",
        }),
      },
      naturalWidth: {
        default: null,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-natural-width"))
          return Number.isFinite(value) && value > 0 ? value : null
        },
        renderHTML: (attributes) => {
          const value = numberAttribute(attributes.naturalWidth)
          return value ? { "data-natural-width": value } : {}
        },
      },
      naturalHeight: {
        default: null,
        parseHTML: (element) => {
          const value = Number(element.getAttribute("data-natural-height"))
          return Number.isFinite(value) && value > 0 ? value : null
        },
        renderHTML: (attributes) => {
          const value = numberAttribute(attributes.naturalHeight)
          return value ? { "data-natural-height": value } : {}
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const showCaption = node.attrs.showCaption === true || node.attrs.showCaption === "true"
    const { wrapperStyle } = getRotatedImageFit(node.attrs)
    const figureAttributes = { ...HTMLAttributes }
    delete figureAttributes.src
    delete figureAttributes.alt

    return [
      "figure",
      mergeAttributes(figureAttributes, { "data-type": "image" }),
      [
        "div",
        {
          class: "w-full overflow-visible",
          style: wrapperStyle,
        },
        [
          "img",
          {
            alt: typeof node.attrs.alt === "string" ? node.attrs.alt : "",
            class: "!m-0 h-auto w-full rounded-md object-contain",
            src: node.attrs.src,
            style: imageTransformStyle(node.attrs),
          },
        ],
      ],
      [
        "figcaption",
        { class: `editor-media-caption mt-1 w-full text-center text-sm ${!showCaption ? "hidden" : ""}`.trim() },
        0,
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          })
        },
    }
  },
})
