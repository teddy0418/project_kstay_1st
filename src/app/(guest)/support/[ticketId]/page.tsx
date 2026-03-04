import { redirect } from "next/navigation";

export default async function SupportTicketRedirect({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  redirect(`/messages/support/${ticketId}`);
}
