import { redirect } from 'next/navigation';

interface TimelineYearAliasPageProps {
  params: Promise<{
    year: string;
  }>;
}

export default async function TimelineYearAliasPage({
  params,
}: TimelineYearAliasPageProps) {
  const resolved = await params;
  const year = Number.parseInt(resolved.year, 10);

  if (!Number.isFinite(year)) {
    redirect('/timeline');
  }

  redirect(`/timeline?year=${year}`);
}
