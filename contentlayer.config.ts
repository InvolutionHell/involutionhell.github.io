import { defineDocumentType, makeSource } from 'contentlayer/source-files'
// import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: `**/*.md?(x)`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string' },
    date: { type: 'date' },
    tags: { type: 'list', of: { type: 'string' } },
  },
  computedFields: {
    slug: {
      type: 'string',
      resolve: (doc) => {
        // Get the flattened path without extension
        let path = doc._raw.flattenedPath
        
        // Handle index files - remove '/index' from the end
        if (path.endsWith('/index')) {
          path = path.replace('/index', '')
        }
        
        // Remove numeric prefixes from the last segment
        const segments = path.split('/')
        const lastSegment = segments[segments.length - 1]
        if (lastSegment && /^\d+-/.test(lastSegment)) {
          segments[segments.length - 1] = lastSegment.replace(/^\d+-/, '')
        }
        
        return segments.join('/')
      }
    },
    slugAsParams: {
      type: 'string', 
      resolve: (doc) => {
        // Same logic as slug, but explicitly for Next.js params
        let path = doc._raw.flattenedPath
        
        if (path.endsWith('/index')) {
          path = path.replace('/index', '')
        }
        
        const segments = path.split('/')
        const lastSegment = segments[segments.length - 1]
        if (lastSegment && /^\d+-/.test(lastSegment)) {
          segments[segments.length - 1] = lastSegment.replace(/^\d+-/, '')
        }
        
        return segments.join('/')
      }
    },
    order: {
      type: 'number',
      resolve: (doc) => {
        const filename = doc._raw.sourceFileName
        
        // Handle index files - always order them first (0)
        if (filename === 'index.mdx' || filename === 'index.md') {
          return 0
        }
        
        // Extract numeric prefix from filename
        const match = filename.match(/^(\d+)-/)
        if (match) {
          return parseInt(match[1], 10)
        }
        
        // No numeric prefix - order at the end
        return 99
      }
    },
    level: {
      type: 'number',
      resolve: (doc) => {
        // Count the number of path segments to determine nesting level
        const segments = doc._raw.flattenedPath.split('/')
        return segments.length
      }
    }
  },
}))

export default makeSource({
  contentDirPath: 'app/docs',
  documentTypes: [Doc],
  mdx: {
    remarkPlugins: [], // 暂时移除 remarkGfm 以解决兼容性问题
    rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
  },
  disableImportAliasWarning: true,
})
