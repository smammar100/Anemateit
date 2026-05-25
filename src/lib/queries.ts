import {sanityClient} from './sanity'
import type {Category, Project} from './types'

const PROJECT_FIELDS = `
  _id,
  _type,
  title,
  slug,
  description,
  thumbnailType,
  thumbnailVideo,
  thumbnailGif,
  category->{_id, _type, title, slug, order},
  technologies,
  copyPrompt,
  viewCodeUrl
`

export async function getAllCategories(): Promise<Category[]> {
  return await sanityClient.fetch<Category[]>(`
    *[_type == "category"] | order(order asc, title asc) {
      _id,
      _type,
      title,
      slug,
      order
    }
  `)
}

export async function getAllProjects(): Promise<Project[]> {
  return await sanityClient.fetch<Project[]>(`
    *[_type == "project"] | order(_createdAt desc) {
      ${PROJECT_FIELDS}
    }
  `)
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return await sanityClient.fetch<Project | null>(
    `*[_type == "project" && slug.current == $slug][0] {
      ${PROJECT_FIELDS}
    }`,
    {slug},
  )
}

export async function getAllProjectSlugs(): Promise<string[]> {
  return await sanityClient.fetch<string[]>(
    `*[_type == "project" && defined(slug.current)][].slug.current`,
  )
}
