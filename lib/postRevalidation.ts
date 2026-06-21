import { revalidatePath, revalidateTag } from "next/cache"

const POST_MUTATION_PATHS = ["/", "/dashboard", "/admin", "/admin/posts"] as const

export function revalidatePostMutationPaths(
  slugs: Array<string | null | undefined> = [],
) {
  revalidateTag("posts", "max")

  for (const path of POST_MUTATION_PATHS) {
    revalidatePath(path)
  }

  for (const slug of new Set(slugs.filter((value): value is string => Boolean(value)))) {
    revalidatePath(`/${slug}`)
  }
}
