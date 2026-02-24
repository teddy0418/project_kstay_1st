import { getPastTripsForCurrentUser } from "@/lib/server/past-trips";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const trips = (await getPastTripsForCurrentUser()) ?? [];
  return <ProfileClient initialTrips={trips} />;
}
