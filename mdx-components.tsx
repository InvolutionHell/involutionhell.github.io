import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    a: ({ children, ...props }) => (
      <a className="hover-link" {...props}>
        {children}
      </a>
    ),
    code: ({ children, ...props }) => (
      <code className="hover-darken-text" {...props}>
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre className="hover-darken-bg" {...props}>
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="hover-darken-bg" {...props}>
        {children}
      </blockquote>
    ),
    h1: ({ children, ...props }) => (
      <h1 className="hover-darken-text" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="hover-darken-text" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="hover-darken-text" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }) => (
      <h4 className="hover-darken-text" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }) => (
      <h5 className="hover-darken-text" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }) => (
      <h6 className="hover-darken-text" {...props}>
        {children}
      </h6>
    ),
    ...components,
  };
}
