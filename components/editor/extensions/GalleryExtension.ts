import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { ImageGalleryBlock } from "@/components/editor/ImageGalleryBlock"
import {
  getGalleryImageAlt,
  parseGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageGallery: {
      setImageGallery: (images: GalleryImage[]) => ReturnType
    }
  }
}

export const GalleryExtension = Node.create({
  name: "imageGallery",

  atom: true,
  draggable: true,
  group: "block",

  addAttributes() {
    return {
      images: {
        default: "[]",
        parseHTML: (element) => element.getAttribute("data-images") ?? "[]",
        renderHTML: (attributes) => ({
          "data-images": attributes.images,
        }),
      },
      columns: {
        default: 2,
        parseHTML: (element) => parseInt(element.getAttribute("data-columns") || "2", 10),
        renderHTML: (attributes) => ({
          "data-columns": attributes.columns,
        }),
      },
    }
  },

  addCommands() {
    return {
      setImageGallery:
        (images) =>
        ({ commands }) =>
          commands.insertContent({
            attrs: { images: serializeGalleryImages(images), columns: 2 },
            type: this.name,
          }),
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageGalleryBlock)
  },

  parseHTML() {
    return [{ tag: 'div[data-type="image-gallery"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const images = parseGalleryImages(node.attrs.images)
    const columns = node.attrs.columns || 2
    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.images
    delete renderedAttributes.columns

    return [
      "div",
      mergeAttributes(renderedAttributes, {
        "data-images": serializeGalleryImages(images),
        "data-columns": columns,
        "data-type": "image-gallery",
        class: "image-gallery",
      }),
      [
        "div",
        { class: "image-gallery__grid", style: `grid-template-columns: repeat(${columns}, minmax(0, 1fr))` },
        ...images.map((image) => [
          "figure",
          { class: "image-gallery__item" },
          [
            "img",
            {
              alt: getGalleryImageAlt(image),
              class: "image-gallery__image",
              src: image.url,
            },
          ],
          ...(image.caption
            ? [
                [
                  "figcaption",
                  { class: "image-gallery__caption" },
                  image.caption,
                ],
              ]
            : []),
        ]),
      ],
    ]
  },
})
