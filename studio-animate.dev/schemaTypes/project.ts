import {defineField, defineType} from 'sanity'

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project Title',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Project Description',
      type: 'text',
      rows: 4,
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'thumbnailType',
      title: 'Thumbnail Type',
      type: 'string',
      options: {
        list: [
          {title: 'Video (MP4 / WebM)', value: 'video'},
          {title: 'GIF', value: 'gif'},
        ],
        layout: 'radio',
      },
      initialValue: 'video',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'thumbnailVideo',
      title: 'Thumbnail Video',
      type: 'file',
      options: {accept: 'video/mp4,video/webm'},
      hidden: ({document}) => document?.thumbnailType !== 'video',
    }),
    defineField({
      name: 'thumbnailGif',
      title: 'Thumbnail GIF',
      type: 'image',
      options: {accept: 'image/gif', hotspot: true},
      hidden: ({document}) => document?.thumbnailType !== 'gif',
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'e.g. Motion Animations, Text Animations, Buttons',
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies Used',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
      description: 'e.g. React, Framer Motion, GSAP, Three.js',
    }),
    defineField({
      name: 'copyPrompt',
      title: 'Copy Prompt',
      type: 'text',
      rows: 12,
      description: 'The prompt users copy to regenerate this animation with AI tools',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'codeFiles',
      title: 'Downloadable Code Files',
      type: 'array',
      description:
        'Files bundled into the .zip when users click "Download Code". Use forward slashes in filenames for folders, e.g. components/MyComp.tsx.',
      of: [
        {
          type: 'object',
          name: 'codeFile',
          fields: [
            defineField({
              name: 'filename',
              title: 'Filename (with optional path)',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'content',
              title: 'File Content',
              type: 'text',
              rows: 20,
              validation: (R) => R.required(),
            }),
          ],
          preview: {select: {title: 'filename', subtitle: 'content'}},
        },
      ],
    }),
    defineField({
      name: 'viewCodeUrl',
      title: 'View Code',
      type: 'url',
      description: 'Link to CodeSandbox, StackBlitz, GitHub, etc.',
      validation: (R) => R.uri({scheme: ['http', 'https']}),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'thumbnailGif',
    },
  },
})
