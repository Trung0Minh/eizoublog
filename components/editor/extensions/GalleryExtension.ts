import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { ImageGalleryBlock } from "@/components/editor/ImageGalleryBlock"
import {
  getGalleryImageAlt,
  normalizeGalleryLayout,
  parseGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

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
      layout: {
        default: "grid",
        parseHTML: (element) =>
          normalizeGalleryLayout(element.getAttribute("data-layout")),
        renderHTML: (attributes) => ({
          "data-layout": normalizeGalleryLayout(attributes.layout),
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
            attrs: {
              columns: 2,
              images: serializeGalleryImages(images),
              layout: "grid",
            },
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
    const layout = normalizeGalleryLayout(node.attrs.layout)
    const hasVisibleCaption = images.some(
      (image) => image.caption && image.showCaption !== false,
    )
    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.images
    delete renderedAttributes.columns
    delete renderedAttributes.layout

    return [
      "div",
      mergeAttributes(renderedAttributes, {
        "data-images": serializeGalleryImages(images),
        "data-layout": layout,
        "data-columns": columns,
        "data-type": "image-gallery",
        class: "image-gallery",
      }),
      [
        "div",
        {
          class:
            layout === "horizontal"
              ? "image-gallery__horizontal"
              : "image-gallery__grid",
          ...(layout === "grid"
            ? {
                style: `grid-template-columns: repeat(${columns}, minmax(0, 1fr))`,
              }
            : {}),
        },
        ...images.map((image) => {
          const isVideoUrl = image.url.match(/\.(mp4|webm)$/i) || image.url.includes("youtube.com") || image.url.includes("youtu.be")
          const isNative = isNativeVideo(image.url)
          const showCaption = image.caption && image.showCaption !== false

          const mediaNode = isVideoUrl
            ? [
                "div",
                { class: isNative ? "w-full" : "relative w-full aspect-video" },
                isNative
                  ? [
                      "video",
                      {
                        class: "h-auto w-full rounded-md bg-black/5",
                        controls: "true",
                        preload: "metadata",
                        src: image.url,
                        title: getGalleryImageAlt(image),
                      },
                    ]
                  : [
                      "iframe",
                      {
                        allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                        allowfullscreen: "true",
                        class: "absolute inset-0 h-full w-full rounded-md",
                        loading: "lazy",
                        src: toVideoEmbedUrl(image.url),
                        title: getGalleryImageAlt(image),
                      },
                    ],
              ]
            : [
                "img",
                {
                  alt: getGalleryImageAlt(image),
                  class: "image-gallery__image",
                  src: image.url,
                },
              ]

          return [
            "figure",
            { class: "image-gallery__item" },
            mediaNode,
            ...(showCaption
              ? [
                  [
                    "figcaption",
                    { class: "image-gallery__caption" },
                    image.caption,
                  ],
                ]
              : hasVisibleCaption
              ? [
                  [
                    "figcaption",
                    {
                      "aria-hidden": "true",
                      class:
                        "image-gallery__caption image-gallery__caption--placeholder",
                    },
                  ],
                ]
              : []),
          ]
        }),
      ],
    ]
  },
})
