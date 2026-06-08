import { Card, CardContent } from "@moritzbrantner/ui";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { diagramPages, type DiagramPage } from "../diagram-pages";
import "../styles.css";

import type React from "react";

export function getDiagramPage(slug: string) {
  const page = diagramPages.find((item) => item.slug === slug);

  if (!page) {
    throw new Error(`Unknown diagram page: ${slug}`);
  }

  return page;
}

export function getIndexHref() {
  return "../";
}

export function getApiDocsHref() {
  return "../api/";
}

export function getDiagramHref(slug: string) {
  return `../${slug}/`;
}

export function renderDiagramPage(children: React.ReactNode) {
  createRoot(document.getElementById("root")!).render(<StrictMode>{children}</StrictMode>);
}

export function DiagramPageShell({
  children,
  page,
}: {
  children: React.ReactNode;
  page: DiagramPage;
}) {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-foreground">
      <header className="grid gap-4">
        <nav className="flex flex-wrap items-center gap-3 text-sm" aria-label="Example navigation">
          <a
            className="inline-flex items-center gap-2 underline underline-offset-4"
            href={getIndexHref()}
          >
            <ArrowLeftIcon className="size-4" aria-hidden="true" />
            Examples index
          </a>
          <a
            className="inline-flex items-center gap-2 underline underline-offset-4"
            href={getApiDocsHref()}
          >
            <BookOpenIcon className="size-4" aria-hidden="true" />
            API docs
          </a>
        </nav>
        <div className="grid gap-2">
          <h1 className="text-3xl font-semibold tracking-normal">{page.title}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{page.description}</p>
        </div>
      </header>

      <section data-testid={`${page.slug}-example`} className="grid min-w-0 gap-4">
        <Card className="grid min-w-0 gap-4 p-4">{children}</Card>
      </section>

      <SnippetPanel snippet={page.snippet} />

      <nav
        aria-label="All diagram examples"
        className="grid gap-2 border-t pt-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        {diagramPages.map((item) => (
          <a
            key={item.slug}
            aria-current={item.slug === page.slug ? "page" : undefined}
            className="rounded-md border px-3 py-2 text-sm hover:bg-muted"
            href={getDiagramHref(item.slug)}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </main>
  );
}

function SnippetPanel({ snippet }: { snippet: string }) {
  return (
    <Card className="grid min-w-0 content-start gap-3 p-4">
      <CardContent className="grid gap-3 p-0">
        <h2 className="text-sm font-semibold tracking-normal">API shape</h2>
        <pre className="min-w-0 whitespace-pre-wrap break-words rounded-md bg-muted p-3 text-xs leading-5 text-muted-foreground">
          <code>{snippet}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
