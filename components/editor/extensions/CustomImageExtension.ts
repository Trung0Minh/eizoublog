import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodeView } from "./ImageNodeView"

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
    return [
      "figure",
      mergeAttributes(HTMLAttributes, { "data-type": "image" }),
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
