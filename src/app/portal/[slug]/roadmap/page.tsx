import { redirect } from "next/navigation";

export default function PublicRoadmapRedirect({
  params,
}: {
  params: { slug: string };
}) {
  redirect(`/portal/${params.slug}`);
}
