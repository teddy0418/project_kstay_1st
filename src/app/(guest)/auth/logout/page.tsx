import { redirect } from "next/navigation";

export default function AuthLogoutRedirect() {
  redirect("/logout");
}
