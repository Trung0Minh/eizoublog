import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { SpoilerView } from "@/components/editor/SpoilerView"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    spoiler: {
      toggleSpoiler: () => ReturnType
    }
  }
}

export const SpoilerExtension = Node.create({
  addAttributes() {
    return {
      hideLabel: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-hide-label"),
        renderHTML: (attributes) =>
          typeof attributes.hideLabel === "string" && attributes.hideLabel
            ? { "data-hide-label": attributes.hideLabel }
            : {},
      },
      showLabel: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-show-label"),
        renderHTML: (attributes) =>
          typeof attributes.showLabel === "string" && attributes.showLabel
            ? { "data-show-label": attributes.showLabel }
            : {},
      },
    }
  },

  addCommands() {
    return {
      toggleSpoiler:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpoilerView)
  },

  content: "block+",
  group: "block",
  name: "spoiler",

  parseHTML() {
    return [{ tag: 'div[data-type="spoiler"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "spoiler" }),
      0,
    ]
  },
})
