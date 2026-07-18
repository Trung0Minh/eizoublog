import { mergeAttributes, Node } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import type { DOMOutputSpec } from "@tiptap/pm/model"

import { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"
import { VideoNodeView } from "./VideoNodeView"

export { isNativeVideo, toVideoEmbedUrl } from "@/components/editor/video"

export const VideoEmbedExtension = Node.create({
  addAttributes() {
    return {
      caption: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-caption") ?? "",
        renderHTML: (attributes) => ({
          "data-caption":
            typeof attributes.caption === "string" ? attributes.caption : "",
        }),
      },
      showCaption: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-show-caption") === "true",
        renderHTML: (attributes) => ({
          "data-show-caption": attributes.showCaption ? "true" : "false",
        }),
      },
      url: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-url"),
        renderHTML: (attributes) => ({
          "data-url": typeof attributes.url === "string" ? attributes.url : "",
        }),
      },
    }
  },

  atom: true,
  group: "block",
  name: "videoEmbed",

  parseHTML() {
    return [{ tag: 'div[data-type="video-embed"]' }]
  },

  renderHTML({ HTMLAttributes, node }) {
    const rawUrl = typeof node.attrs.url === "string" ? node.attrs.url : ""
    const caption =
      typeof node.attrs.caption === "string" ? node.attrs.caption : ""
    const showCaption = node.attrs.showCaption !== false && node.attrs.showCaption !== "false"

    const isNative = isNativeVideo(rawUrl)
    const mediaNode: DOMOutputSpec = isNative
      ? [
          "video",
          {
            class: "h-auto w-full rounded-md bg-black/5",
            controls: "true",
            preload: "metadata",
            src: rawUrl,
            title: caption || "Embedded video",
          },
        ]
      : [
          "iframe",
          {
            allow:
              "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowfullscreen: "true",
            class: "absolute inset-0 h-full w-full rounded-md",
            loading: "lazy",
            src: toVideoEmbedUrl(rawUrl),
            title: caption || "Embedded video",
          },
        ]

    const children: DOMOutputSpec[] = [
      [
        "div",
        { class: isNative ? "w-full" : "relative w-full aspect-video" },
        mediaNode,
      ],
    ]

    if (caption && showCaption) {
      children.push([
        "figcaption",
        { class: "media-caption" },
        caption,
      ])
    }

    return [
      "figure",
      mergeAttributes(HTMLAttributes, {
        class: "my-6",
        "data-type": "video-embed",
      }),
      ...children,
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView)
  },
})
