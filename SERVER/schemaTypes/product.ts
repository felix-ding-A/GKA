// schemaTypes/product.ts — Product schema for B2B plant extracts
import { defineType, defineField, defineArrayMember } from 'sanity'
import { CustomMarkdownInput } from './components/CustomMarkdownInput'

export const productType = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: () => '🌿',
  groups: [
    { name: 'basic',     title: 'Basic Info',           default: true },
    { name: 'technical', title: 'Technical Specs' },
    { name: 'i18n',      title: '🌍 Translations (RU & AR & ES)' },
    { name: 'media',     title: 'Media' },
    { name: 'documents', title: 'Documents' },
    { name: 'seo',       title: 'SEO' },
    { name: 'faq',       title: 'FAQ' },
  ],
  fields: [
    // ── Basic Info ────────────────────────────────
    defineField({
      name: 'name',
      title: 'Product Name',
      type: 'string',
      group: 'basic',
      description: 'e.g. "PQQ Disodium Salt" or "EGCG 98%"',
      validation: (Rule) => Rule.required().min(2).max(100),
    }),
    defineField({
      name: 'cname',
      title: 'CNAME (Backend Record Name)',
      type: 'string',
      group: 'basic',
      description: '中文名称或内部备用名，仅在后台记录使用，前端不会展示。',
    }),
    defineField({
      name: 'slug',
      title: 'URL Slug',
      type: 'slug',
      group: 'basic',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'previousSlugs',
      title: 'Previous Slugs (Automatic SEO Redirects)',
      type: 'array',
      group: 'seo',
      readOnly: true,
      hidden: ({ value }) => !Array.isArray(value) || value.length === 0,
      description: 'Automatically maintained after publishing a slug change. Every old product URL permanently redirects to the current slug.',
      of: [defineArrayMember({ type: 'string' })],
      validation: (Rule) => Rule.unique(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      group: 'basic',
      description: 'Select one or more product categories (multi-select supported).',
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'mainCategories',
      title: 'Main Categories',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Liposomal Formulations', value: 'liposomal' },
          { title: 'Pet Longevity', value: 'pet-longevity' },
          { title: 'Superfoods', value: 'superfood' },
          { title: 'Cosmetic Ingredients', value: 'cosmetic-ingredients' },
        ],
        layout: 'tags',
      },
      group: 'basic',
    }),
    defineField({
      name: 'antiAgingMechanisms',
      title: 'Anti-Aging Mechanisms',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'Collagen Stimulant', value: 'collagen-stimulant' },
          { title: 'MMP Inhibitor', value: 'mmp-inhibitor' },
          { title: 'Anti-Glycation', value: 'anti-glycation' },
        ],
        layout: 'tags',
      },
      group: 'basic',
    }),
    defineField({
      name: 'applicationDisplay',
      title: 'Application Display Mode',
      type: 'string',
      options: {
        list: [
          { title: 'Topical Use (Cosmetic Grade)', value: 'topical' },
          { title: 'Oral Use (Nutricosmetic)', value: 'oral' },
          { title: 'Dual Application (Shared Ingredient)', value: 'dual' },
        ],
        layout: 'radio',
      },
      group: 'basic',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Product',
      type: 'boolean',
      group: 'basic',
      description: 'Show on homepage and top of product listings',
      initialValue: false,
    }),
    defineField({
      name: 'weight',
      title: 'Product Weight / Priority (0 - 9999)',
      type: 'number',
      group: 'basic',
      description: '产品权重分值（0 - 9999），数字越大在前端产品列表页和后台列表中排列越靠前。默认 0。',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(9999).integer(),
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short Description',
      type: 'text',
      group: 'basic',
      rows: 3,
      description: 'One paragraph summary (shown in product cards)',
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'description',
      title: 'Full Description (Markdown)',
      type: 'markdown',
      group: 'basic',
      components: {
        input: CustomMarkdownInput,
      },
    }),

    // ── Technical Specs ────────────────────────────
    defineField({
      name: 'botanicalName',
      title: 'Botanical / Chemical Name',
      type: 'string',
      group: 'technical',
      description: 'e.g. "Pyrroloquinoline quinone disodium salt" or Latin name',
    }),
    defineField({
      name: 'casNumber',
      title: 'CAS Number',
      type: 'string',
      group: 'technical',
      description: 'e.g. "122628-50-6"',
    }),
    defineField({
      name: 'activeIngredient',
      title: 'Active Ingredient',
      type: 'string',
      group: 'technical',
      description: 'Main active compound name',
    }),
    defineField({
      name: 'purity',
      title: 'Purity',
      type: 'string',
      group: 'technical',
      description: 'e.g. "≥ 99%" or "40% Glabridin"',
    }),
    defineField({
      name: 'specifications',
      title: 'Technical Specifications',
      type: 'array',
      group: 'technical',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({ name: 'label', type: 'string', title: 'Parameter' }),
            defineField({ name: 'value', type: 'string', title: 'Value' }),
          ],
          preview: {
            select: { title: 'label', subtitle: 'value' },
          },
        }),
      ],
      description: 'Add rows like: Appearance → White powder, Moisture → ≤ 5%',
    }),
    defineField({
      name: 'applications',
      title: 'Applications / Use Cases (Markdown)',
      type: 'markdown',
      group: 'technical',
      description: 'Describe the applications and use cases for the product in markdown format.',
      components: {
        input: CustomMarkdownInput,
      },
    }),

    // ── 🌍 Translations (Russian) ─────────────────
    defineField({
      name: 'shortDescription_ru',
      title: '🇷🇺 Краткое описание (RU)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Краткое описание продукта на русском языке (для карточек товара)',
    }),
    defineField({
      name: 'description_ru',
      title: '🇷🇺 Полное описание (RU, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Полное описание продукта на русском языке в формате Markdown.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'applications_ru',
      title: '🇷🇺 Применение (RU, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Применение продукта на русском языке.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_ru',
      title: '🇷🇺 Meta Title (RU)',
      type: 'string',
      group: 'i18n',
      description: 'Русский заголовок для SEO, не более 60 символов.',
    }),
    defineField({
      name: 'meta_description_ru',
      title: '🇷🇺 Meta Description (RU)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Русское описание для SEO, не более 160 символов.',
    }),

    // ── 🌍 Translations (Arabic) ─────────────────
    defineField({
      name: 'shortDescription_ar',
      title: '🇸🇦 الوصف القصير (AR)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'الوصف القصير للمنتج باللغة العربية (لبطاقات المنتج)',
    }),
    defineField({
      name: 'description_ar',
      title: '🇸🇦 الوصف الكامل (AR, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'الوصف الكامل للمنتج باللغة العربية بصيغة Markdown.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'applications_ar',
      title: '🇸🇦 التطبيقات (AR, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'تطبيقات المنتج باللغة العربية.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_ar',
      title: '🇸🇦 Meta Title (AR)',
      type: 'string',
      group: 'i18n',
      description: 'العنوان التعريفي المخصص للـ SEO باللغة العربية (بحد أقصى 60 حرفاً).',
    }),
    defineField({
      name: 'meta_description_ar',
      title: '🇸🇦 Meta Description (AR)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'الوصف التعريفي المخصص للـ SEO باللغة العربية (بحد أقصى 160 حرفاً).',
    }),

    // ── 🌍 Translations (Spanish) ────────────────
    defineField({
      name: 'shortDescription_es',
      title: '🇪🇸 Descripción Corta (ES)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Breve descripción del producto en español (para tarjetas de producto)',
    }),
    defineField({
      name: 'description_es',
      title: '🇪🇸 Descripción Completa (ES, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Descripción completa del producto en español en formato Markdown.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'applications_es',
      title: '🇪🇸 Aplicaciones (ES, Markdown)',
      type: 'markdown',
      group: 'i18n',
      description: 'Aplicaciones y casos de uso del producto en español.',
      components: { input: CustomMarkdownInput },
    }),
    defineField({
      name: 'meta_title_es',
      title: '🇪🇸 Meta Title (ES)',
      type: 'string',
      group: 'i18n',
      description: 'Título meta personalizado para SEO en español (máx 60 caracteres).',
    }),
    defineField({
      name: 'meta_description_es',
      title: '🇪🇸 Meta Description (ES)',
      type: 'text',
      group: 'i18n',
      rows: 3,
      description: 'Descripción meta personalizada para SEO en español (máx 160 caracteres).',
    }),

    defineField({
      name: 'certifications',
      title: 'Certifications',
      type: 'array',
      group: 'technical',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        list: [
          { title: 'ISO 9001:2015', value: 'ISO 9001:2015' },
          { title: 'GMP', value: 'GMP' },
          { title: 'FSSC 22000', value: 'FSSC 22000' },
          { title: 'Kosher', value: 'Kosher' },
          { title: 'Halal', value: 'Halal' },
          { title: 'Organic', value: 'Organic' },
          { title: 'Non-GMO', value: 'Non-GMO' },
          { title: 'Vegan', value: 'Vegan' },
        ],
        layout: 'tags',
      },
    }),
    defineField({
      name: 'minimumOrderQuantity',
      title: 'Minimum Order Quantity',
      type: 'string',
      group: 'technical',
      description: 'e.g. "1kg", "25kg"',
    }),
    defineField({
      name: 'packagingOptions',
      title: 'Packaging Options',
      type: 'array',
      group: 'technical',
      of: [defineArrayMember({ type: 'string' })],
      description: 'e.g. ["1kg bags", "25kg drums", "Custom packaging"]',
    }),
    defineField({
      name: 'shelfLife',
      title: 'Shelf Life',
      type: 'string',
      group: 'technical',
      description: 'e.g. "24 months from manufacture date"',
    }),
    defineField({
      name: 'storageConditions',
      title: 'Storage Conditions',
      type: 'string',
      group: 'technical',
      description: 'e.g. "Store in a cool, dry place, away from direct sunlight"',
    }),

    // ── Media ───────────────────────────────────────
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
      group: 'media',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          type: 'string',
          title: 'Alt Text (Required for SEO)',
          description: 'Describe the image for accessibility and SEO',
          validation: (Rule) => Rule.required().error('Hero Image 的 Alt 替代文本不可为空！'),
        }),
      ],
    }),
    defineField({
      name: 'productVideo',
      title: 'Product Demonstration Video',
      type: 'mux.video',
      group: 'media',
      description: 'Upload video for product demonstration via Mux Video CDN',
    }),
    defineField({
      name: 'gallery',
      title: 'Image Gallery',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              type: 'string',
              title: 'Alt Text',
              validation: (Rule) => Rule.required().error('画廊图片的 Alt 替代文本不可为空！'),
            }),
          ],
        }),
      ],
    }),

    // ── Documents ──────────────────────────────────
    defineField({
      name: 'coaFile',
      title: 'COA (Certificate of Analysis)',
      type: 'file',
      group: 'documents',
      description: 'Upload the Certificate of Analysis PDF',
    }),
    defineField({
      name: 'msdsFile',
      title: 'MSDS / SDS (Safety Data Sheet)',
      type: 'file',
      group: 'documents',
    }),
    defineField({
      name: 'tdsFile',
      title: 'TDS (Technical Data Sheet)',
      type: 'file',
      group: 'documents',
      description: 'Upload Technical Data Sheet (TDS) PDF',
    }),
    defineField({
      name: 'specSheet',
      title: 'TDS / Product Specification Sheet',
      type: 'file',
      group: 'documents',
      description: 'Upload Technical Data Sheet (TDS) / Specification PDF',
    }),

    // ── SEO ─────────────────────────────────────────
    defineField({
      name: 'meta_title',
      title: 'Meta Title (EN)',
      type: 'string',
      group: 'seo',
      description: 'Custom meta title for SEO optimization (建议 10~60 字符).',
      validation: (Rule) =>
        Rule.required()
          .error('SEO 错误：Meta Title 不能为空！')
          .min(10)
          .warning('SEO 提示：Meta Title 建议不少于 10 个字符')
          .max(60)
          .error('SEO 错误：Meta Title 超过 60 个字符，谷歌搜素结果会被截断！'),
    }),
    defineField({
      name: 'meta_description',
      title: 'Meta Description (EN)',
      type: 'text',
      group: 'seo',
      rows: 3,
      description: 'Custom meta description for SEO optimization (建议 50~160 字符).',
      validation: (Rule) =>
        Rule.required()
          .error('SEO 错误：Meta Description 不能为空！')
          .min(50)
          .warning('SEO 提示：Meta Description 建议不少于 50 个字符')
          .max(160)
          .error('SEO 错误：Meta Description 超过 160 个字符，谷歌搜素结果会被截断！'),
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items (EN)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this product in English',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Answer',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_ru',
      title: 'FAQ Items (RU)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this product in Russian',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Вопрос',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Ответ',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_ar',
      title: 'FAQ Items (AR)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this product in Arabic',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'السؤال',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'الإجابة',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'faqItems_es',
      title: 'FAQ Items (ES)',
      type: 'array',
      group: 'faq',
      description: 'Frequently Asked Questions for this product in Spanish',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({
              name: 'question',
              title: 'Pregunta',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'answer',
              title: 'Respuesta',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
          ],
        }),
      ],
    }),
  ],

  orderings: [
    {
      title: 'Weight (High -> Low)',
      name: 'weightDesc',
      by: [
        { field: 'weight', direction: 'desc' },
        { field: '_updatedAt', direction: 'desc' }
      ]
    },
    {
      title: 'Category',
      name: 'categoryAsc',
      by: [
        { field: 'category._ref', direction: 'asc' },
        { field: 'name', direction: 'asc' }
      ]
    },
    {
      title: 'Name',
      name: 'nameAsc',
      by: [
        { field: 'name', direction: 'asc' }
      ]
    }
  ],
  preview: {
    select: {
      title: 'name',
      cname: 'cname',
      weight: 'weight',
      cat0Name: 'category.0.name',
      cat1Name: 'category.1.name',
      subtitle: 'purity',
      media: 'heroImage',
    },
    prepare({ title, cname, weight, cat0Name, cat1Name, subtitle, media }) {
      const wScore = typeof weight === 'number' ? weight : 0;
      const wBadge = wScore > 0 ? `[W: ${wScore}] ` : '[W: 0] ';
      const cnSuffix = cname ? ` (${cname})` : '';
      const subtitleParts = []
      const catNames = [cat0Name, cat1Name].filter(Boolean)
      if (catNames.length > 0) subtitleParts.push(catNames.join(', '))
      if (subtitle) subtitleParts.push(`Purity: ${subtitle}`)
      return {
        title: `${wBadge}${title || 'Untitled Product'}${cnSuffix}`,
        subtitle: subtitleParts.join(' | ') || 'No category or purity set',
        media,
      }
    },
  },
})
