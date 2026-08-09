import type { CSSProperties } from "react"

export interface MediaPresentationInput {
  flipX?: unknown
  flipY?: unknown
  naturalHeight?: unknown
  naturalWidth?: unknown
  rotation?: unknown
}

export const DEFAULT_NATIVE_VIDEO_ASPECT_RATIO = "16 / 9"

export function finiteMediaNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

export function positiveMediaDimension(value: unknown) {
  const number = finiteMediaNumber(value)
  return number !== null && number > 0 ? number : null
}

export function normalizeMediaRotation(value: unknown) {
  const rotation = finiteMediaNumber(value) ?? 0
  return ((rotation % 360) + 360) % 360
}

export function hasSavedMediaDimensions(input: MediaPresentationInput) {
  return Boolean(
    positiveMediaDimension(input.naturalWidth) &&
      positiveMediaDimension(input.naturalHeight),
  )
}

export function getNativeVideoAspectRatio(input: MediaPresentationInput) {
  const naturalWidth = positiveMediaDimension(input.naturalWidth)
  const naturalHeight = positiveMediaDimension(input.naturalHeight)

  return naturalWidth && naturalHeight
    ? `${naturalWidth} / ${naturalHeight}`
    : DEFAULT_NATIVE_VIDEO_ASPECT_RATIO
}

export function getNativeVideoFrameStyle(
  input: MediaPresentationInput,
): CSSProperties {
  return { aspectRatio: getNativeVideoAspectRatio(input) }
}

export function nativeVideoFrameStyleAttribute(input: MediaPresentationInput) {
  return `aspect-ratio: ${getNativeVideoAspectRatio(input)};`
}

export function getMediaPresentation(input: MediaPresentationInput) {
  const rotation = finiteMediaNumber(input.rotation) ?? 0
  const normalizedRotation = normalizeMediaRotation(rotation)
  const naturalWidth = positiveMediaDimension(input.naturalWidth)
  const naturalHeight = positiveMediaDimension(input.naturalHeight)
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270
  const imageScale = isQuarterTurn && naturalWidth && naturalHeight
    ? naturalWidth / naturalHeight
    : 1
  const wrapperAspectRatio = isQuarterTurn && naturalWidth && naturalHeight
    ? `${naturalHeight} / ${naturalWidth}`
    : null
  const scaleX = input.flipX === true || input.flipX === "true" ? -1 : 1
  const scaleY = input.flipY === true || input.flipY === "true" ? -1 : 1
  const transform = `rotate(${rotation}deg) scale(${imageScale * scaleX}, ${imageScale * scaleY})`
  const wrapperStyle = wrapperAspectRatio
    ? {
        alignItems: "center",
        aspectRatio: wrapperAspectRatio,
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
        width: "100%",
      } satisfies CSSProperties
    : undefined

  return {
    imageStyle: {
      transform,
      transformOrigin: "center",
    } satisfies CSSProperties,
    rotation,
    transform,
    wrapperAspectRatio,
    wrapperStyle,
  }
}

export function mediaWrapperStyleAttribute(input: MediaPresentationInput) {
  const { wrapperAspectRatio } = getMediaPresentation(input)

  return wrapperAspectRatio
    ? `align-items: center; aspect-ratio: ${wrapperAspectRatio}; display: flex; justify-content: center; overflow: hidden; width: 100%;`
    : ""
}

export function mediaImageStyleAttribute(input: MediaPresentationInput) {
  return `transform: ${getMediaPresentation(input).transform}; transform-origin: center;`
}
