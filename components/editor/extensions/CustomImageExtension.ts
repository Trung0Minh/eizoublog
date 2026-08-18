import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodeView } from "./ImageNodeView"
import {
  mediaImageStyleAttribute,
  mediaWrapperStyleAttribute,
  normalizeMediaRotation,
  positiveMediaDimension,
} from "@/lib/mediaPresentation"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    customImage: {
      setImage: (options: { src: string; alt?: string }) => ReturnType
    }
  }
}

export const CustomImageExtension = Node.create({
  name: "customImage",
  priority: 1_000,
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
          normalizeMediaRotation(
            Number(element.getAttribute("data-rotation") ?? 0),
          ),
        renderHTML: (attributes) => ({
          "data-rotation": normalizeMediaRotation(attributes.rotation),
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
          const value = positiveMediaDimension(attributes.naturalWidth)
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
          const value = positiveMediaDimension(attributes.naturalHeight)
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
    const wrapperStyle = mediaWrapperStyleAttribute(node.attrs)
    const figureAttributes = { ...HTMLAttributes }
    delete figureAttributes.src
    delete figureAttributes.alt

    return [
      "figure",
      mergeAttributes(figureAttributes, { "data-type": "image" }),
      [
        "div",
        {
          class: "w-full",
          style: wrapperStyle,
        },
        [
          "img",
          {
            alt: typeof node.attrs.alt === "string" ? node.attrs.alt : "",
            class: "!m-0 h-auto w-full rounded-md object-contain",
            src: node.attrs.src,
            style: mediaImageStyleAttribute(node.attrs),
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

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (!this.editor.isActive(this.name)) {
          return false
        }

        return this.editor.commands.insertContent({ type: "hardBreak" })
      },
    }
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
