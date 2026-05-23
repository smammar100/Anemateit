import {sanityClient} from './sanity'
import type {Project} from './types'

export async function getAllProjects(): Promise<Project[]> {
  return await sanityClient.fetch<Project[]>(`
    *[_type == "project"] | order(_createdAt desc) {
      _id,
      _type,
      title,
      slug,
      description,
      thumbnailType,
      thumbnailVideo,
      thumbnailGif,
      technologies,
      copyPrompt,
      viewCodeUrl
    }
  `)
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return await sanityClient.fetch<Project | null>(
    `*[_type == "project" && slug.current == $slug][0] {
      _id,
      _type,
      title,
      slug,
      description,
      thumbnailType,
      thumbnailVideo,
      thumbnailGif,
      technologies,
      copyPrompt,
      viewCodeUrl
    }`,
    {slug},
  )
}

export async function getAllProjectSlugs(): Promise<string[]> {
  return await sanityClient.fetch<string[]>(
    `*[_type == "project" && defined(slug.current)][].slug.current`,
  )
}
