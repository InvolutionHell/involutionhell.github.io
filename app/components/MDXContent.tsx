"use client"

import { useMDXComponent } from 'next-contentlayer/hooks'

export default function MDXContent({ code }: { code: string }) {
  const MDX = useMDXComponent(code)
  return <MDX />
}
