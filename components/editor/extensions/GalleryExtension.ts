import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"

import { ImageGalleryBlock } from "@/components/editor/ImageGalleryBlock"
import {
  galleryRowHasCaption,
  getGalleryImageAlt,
  getGalleryImagePresentation,
  groupGalleryImagesIntoRows,
  normalizeGalleryLayout,
  parseGalleryImages,
  serializeGalleryImages,
  type GalleryImage,
} from "@/components/editor/gallery"
import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

function imageTransformStyle(image: GalleryImage) {
  return `transform: ${getGalleryImagePresentation(image).transform}; transform-origin: center;`
}

function imageWrapperStyle(image: GalleryImage) {
  const { wrapperAspectRatio } = getGalleryImagePresentation(image)

  if (!wrapperAspectRatio) {
    return undefined
  }

  return `align-items: center; aspect-ratio: ${wrapperAspectRatio}; display: flex; justify-content: center; width: 100%;`
}

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
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => ({
          "data-caption": typeof attributes.caption === "string" ? attributes.caption : "",
        }),
      },
      showCaption: {
        default: false,
        parseHTML: (element) => element.getAttribute("data-show-caption") === "true",
        renderHTML: (attributes) => ({
          "data-show-caption": attributes.showCaption === true ? "true" : "false",
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
    const caption = typeof node.attrs.caption === "string" ? node.attrs.caption : ""
    const showGalleryCaption = node.attrs.showCaption === true && caption
    const galleryRows = layout === "grid"
      ? groupGalleryImagesIntoRows(images, columns)
      : [images.map((image, index) => ({ image, index }))]
    const renderedAttributes = { ...HTMLAttributes }
    delete renderedAttributes.images
    delete renderedAttributes.columns
    delete renderedAttributes.layout
    delete renderedAttributes.caption
    delete renderedAttributes.showCaption

    if (images.length === 1) {
      const [image] = images
      const showCaption = image.caption.trim() && image.showCaption !== false

      return [
        "figure",
        mergeAttributes(renderedAttributes, {
          "data-align": "center",
          "data-type": "image",
          class: "relative flex flex-col items-center justify-center clear-both",
          style: "width: 100%; max-width: 100%",
        }),
        [
          "img",
          {
            alt: getGalleryImageAlt(image),
            class: "!m-0 h-auto w-full rounded-md object-contain",
            src: image.url,
          },
        ],
        ...(showCaption
          ? [
              [
                "figcaption",
                { class: "media-caption" },
                image.caption,
              ],
            ]
          : []),
      ]
    }

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
        },
        ...galleryRows.map((row) => [
          "div",
          {
            class: "image-gallery__grid-row",
            ...(layout === "grid"
              ? {
                  style: `grid-template-columns: repeat(${Math.min(columns, images.length)}, minmax(0, 1fr))`,
                }
              : {}),
          },
          ...row.map(({ image, index }) => {
          const isVideoUrl = image.url.match(/\.(mp4|webm)$/i) || image.url.includes("youtube.com") || image.url.includes("youtu.be")
          const isNative = isNativeVideo(image.url)
          const showCaption = image.caption.trim() && image.showCaption !== false
          const reserveCaptionSpace = layout === "grid" && !showCaption && galleryRowHasCaption(images, index, columns)

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
                "div",
                { class: "w-full", style: imageWrapperStyle(image) },
                [
                  "img",
                  {
                    alt: getGalleryImageAlt(image),
                    class: "image-gallery__image",
                    src: image.url,
                    style: imageTransformStyle(image),
                  },
                ],
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
              : reserveCaptionSpace
              ? [
                  [
                    "figcaption",
                    {
                      "aria-hidden": "true",
                      class: "image-gallery__caption image-gallery__caption--placeholder",
                    },
                  ],
                ]
              : []),
          ]
          }),
        ]),
      ],
      ...(showGalleryCaption
        ? [["p", { class: "image-gallery__gallery-caption" }, caption]]
        : []),
    ]
  },
})
