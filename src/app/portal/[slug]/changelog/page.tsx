import { redirect } from "next/navigation";

export default function PublicChangelogRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/portal/${params.slug}`);
}
