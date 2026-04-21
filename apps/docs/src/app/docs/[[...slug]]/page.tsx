import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "@/components/mdx";
import { source } from "@/lib/source";

const SITE_URL = "https://bromso.github.io/figma-plugin-template";
const REPO_URL = "https://github.com/bromso/figma-plugin-template";

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage
      toc={page.data.toc}
      tableOfContent={{ style: "normal" }}
      editOnGithub={{
        owner: "bromso",
        repo: "figma-plugin-template",
        sha: "master",
        path: `apps/docs/content/docs/${page.file.path}`,
      }}
      breadcrumb={{ enabled: true }}
      footer={{ enabled: true }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const slug = params.slug?.join("/") || "";
  const url = `${SITE_URL}/docs/${slug}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: { canonical: url },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url,
      siteName: "Figma Plugin Template",
      type: "article",
    },
    twitter: {
      card: "summary",
      title: page.data.title,
      description: page.data.description,
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "TechArticle",
        headline: page.data.title,
        description: page.data.description,
        url,
        publisher: {
          "@type": "Organization",
          name: "Figma Plugin Template",
          url: REPO_URL,
        },
      }),
    },
  };
}
