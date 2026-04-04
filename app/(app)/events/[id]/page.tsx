'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useAppSelector } from '../../../../store/store';

function decodeEventId(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const articleId = typeof params?.id === 'string' ? params.id : '';
  const decodedId = decodeEventId(articleId);
  const articles = useAppSelector((state) => state.news.articles);

  const article = useMemo(() => {
    return (
      articles.find((item) => item.url === decodedId) ??
      articles.find((item) => encodeURIComponent(item.url) === articleId) ??
      null
    );
  }, [articleId, articles, decodedId]);

  if (!article) {
    return (
      <main className="py-8 text-slate-100">
        <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Event Detail</p>
          <h1 className="mt-2 text-2xl font-semibold">Event not found</h1>
          <p className="mt-2 text-sm text-slate-300">
            This event is not available in current in-memory feed data. Run a new search
            from dashboard and try again.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Return to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4 py-1 text-slate-100">
      <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-6">
        <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Event Detail</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{article.title}</h1>
        <p className="mt-2 text-sm text-slate-400">
          Source: {article.source.name} • {new Date(article.publishedAt).toLocaleString()}
        </p>
        {article.description ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{article.description}</p>
        ) : null}
        {article.content ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{article.content}</p>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300"
          >
            Open Source Article
          </a>
          <Link
            href="/dashboard"
            className="rounded-md border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-white/5"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
