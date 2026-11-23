import {ExpandIcon} from '@sanity/icons'
import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'accordion',
  type: 'object',
  title: 'Utfällbar sektion',
  icon: ExpandIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Rubrik',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      type: 'array',
      title: 'Innehåll',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{title: 'Normal', value: 'normal'}],
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Länk',
                fields: [
                  defineField({
                    name: 'url',
                    type: 'string',
                    title: 'URL',
                  }),
                ],
              },
              {
                name: 'button',
                type: 'object',
                title: 'Knapp',
                fields: [
                  defineField({
                    name: 'url',
                    type: 'string',
                    title: 'URL',
                  }),
                  defineField({
                    name: 'primary',
                    type: 'boolean',
                  }),
                ],
              },
            ],
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title || 'Namnlös utfällbar sektion',
        subtitle: 'Utfällbar sektion',
      }
    },
  },
})
