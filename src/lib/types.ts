export interface SanitySlug {
  _type: 'slug'
  current: string
}

export interface SanityImageAsset {
  _type: 'image'
  asset: {
    _ref: string
    _type: 'reference'
  }
  hotspot?: unknown
  crop?: unknown
}

export interface SanityFileAsset {
  _type: 'file'
  asset: {
    _ref: string
    _type: 'reference'
  }
}

export type ThumbnailType = 'video' | 'gif'

export interface Project {
  _id: string
  _type: 'project'
  title: string
  slug: SanitySlug
  description: string
  thumbnailType: ThumbnailType
  thumbnailVideo?: SanityFileAsset
  thumbnailGif?: SanityImageAsset
  technologies?: string[]
  copyPrompt: string
  viewCodeUrl?: string
}
