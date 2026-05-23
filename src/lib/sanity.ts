import {sanityClient} from 'sanity:client'
import imageUrlBuilder from '@sanity/image-url'
import type {SanityImageSource} from '@sanity/image-url/lib/types/types'

const builder = imageUrlBuilder(sanityClient)

export const urlFor = (source: SanityImageSource) => builder.image(source)
export {sanityClient}

export function fileUrl(ref: string | undefined): string | null {
  if (!ref) return null
  const [, id, ext] = ref.split('-')
  if (!id || !ext) return null
  const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID
  const dataset = import.meta.env.PUBLIC_SANITY_DATASET
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}`
}
