export default {
  name: 'car',
  title: 'Car Listing',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Car Name',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'brand',
      title: 'Brand',
      type: 'string',
      options: {
        list: [
          { title: 'Lexus', value: 'Lexus' },
          { title: 'Toyota', value: 'Toyota' },
          { title: 'Mercedes-Benz', value: 'Mercedes-Benz' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'year',
      title: 'Year',
      type: 'number',
      validation: Rule => Rule.required().min(1990).max(2030),
    },
    {
      name: 'price',
      title: 'Price (₦)',
      type: 'number',
      validation: Rule => Rule.required().min(0),
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'In Stock', value: 'In Stock' },
          { title: 'Sold', value: 'Sold' },
          { title: 'Reserved', value: 'Reserved' },
        ],
        layout: 'radio',
      },
      initialValue: 'In Stock',
    },
    {
      name: 'badges',
      title: 'Badges',
      type: 'array',
      of: [
        {
          type: 'string',
          options: {
            list: [
              { title: 'New', value: 'new' },
              { title: 'Hot', value: 'hot' },
              { title: 'Used', value: 'used' },
              { title: 'Pre-Owned', value: 'Pre-Owned' },
            ],
          },
        },
      ],
    },
    {
      name: 'images',
      title: 'Car Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            },
          ],
        },
      ],
      validation: Rule => Rule.required().min(1),
    },
    {
      name: 'engine',
      title: 'Engine',
      type: 'string',
    },
    {
      name: 'fuel',
      title: 'Fuel Type',
      type: 'string',
      options: {
        list: [
          { title: 'Petrol', value: 'Petrol' },
          { title: 'Diesel', value: 'Diesel' },
          { title: 'Electric', value: 'Electric' },
          { title: 'Hybrid', value: 'Hybrid' },
        ],
      },
    },
    {
      name: 'transmission',
      title: 'Transmission',
      type: 'string',
      options: {
        list: [
          { title: 'Automatic', value: 'Automatic' },
          { title: 'Manual', value: 'Manual' },
          { title: 'CVT', value: 'CVT' },
        ],
      },
    },
    {
      name: 'bodyType',
      title: 'Body Type',
      type: 'string',
      options: {
        list: [
          { title: 'Sedan', value: 'Sedan' },
          { title: 'SUV', value: 'SUV' },
          { title: 'Luxury SUV', value: 'Luxury SUV' },
          { title: 'Compact SUV', value: 'Compact SUV' },
          { title: 'Crossover SUV', value: 'Crossover SUV' },
          { title: 'Luxury Sedan', value: 'Luxury Sedan' },
          { title: 'Pickup Truck', value: 'Pickup Truck' },
          { title: 'Luxury', value: 'Luxury' },
        ],
      },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 4,
    },
    {
      name: 'interior',
      title: 'Interior Features',
      type: 'text',
      rows: 3,
    },
    {
      name: 'exterior',
      title: 'Exterior Features',
      type: 'text',
      rows: 3,
    },
    {
      name: 'safety',
      title: 'Safety Features',
      type: 'text',
      rows: 3,
    },
    {
      name: 'infotainment',
      title: 'Infotainment Features',
      type: 'text',
      rows: 3,
    },
    {
      name: 'whyGet',
      title: 'Why Get This Car (bullet points)',
      type: 'array',
      of: [{ type: 'string' }],
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'year',
      media: 'images.0',
    },
    prepare({ title, subtitle, media }) {
      return {
        title,
        subtitle: subtitle ? `${subtitle}` : '',
        media,
      };
    },
  },
};
