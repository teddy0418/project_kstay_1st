import { redirect } from "next/navigation";

export default function SignoutRedirect() {
  redirect("/logout");
}
