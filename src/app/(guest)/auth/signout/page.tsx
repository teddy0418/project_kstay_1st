import { redirect } from "next/navigation";

export default function AuthSignoutRedirect() {
  redirect("/logout");
}
