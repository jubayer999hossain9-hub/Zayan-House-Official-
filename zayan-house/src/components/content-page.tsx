import { getPageBody, PAGE_TITLES, type PageKey } from "@/lib/page-content";
import { RichText } from "./rich-text";

export async function ContentPage({ pageKey, children }: { pageKey: PageKey; children?: React.ReactNode }) {
  const body = await getPageBody(pageKey);
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="mb-8 text-4xl text-green sm:text-5xl">{PAGE_TITLES[pageKey]}</h1>
      <RichText text={body} />
      {children}
    </article>
  );
}
