import { getPastTripsForCurrentUser, type TripItem } from "@/lib/server/past-trips";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  let trips: TripItem[] = [];
  try {
    trips = (await getPastTripsForCurrentUser()) ?? [];
  } catch {
    // 서버 에러가 나더라도 프로필 페이지 자체는 열리도록 빈 배열로 처리
    trips = [];
  }
  return <ProfileClient initialTrips={trips} />;
}
