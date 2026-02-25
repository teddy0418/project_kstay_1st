import { Body, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

type Props = {
  bookingToken: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  guestsText: string;
  totalText: string;
  cancellationDeadlineKst: string;
  manageUrl: string;
  /** 숙소정보에서 입력한 체크인/아웃 시간 (예: 15:00, 11:00) */
  checkInTime?: string;
  checkOutTime?: string;
  /** 숙소정보 → 예약 확정 후 전달 안내 */
  checkInGuide?: string;
  houseRules?: string;
  /** 위치 단계에서 입력한 정확한 주소 (예약 확정 후 게스트에게 전달) */
  fullAddress?: string;
};

export default function BookingConfirmedEmail(props: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your KSTAY booking is confirmed</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Arial, sans-serif", padding: "20px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ margin: "0 0 12px", fontSize: "24px" }}>Booking confirmed</Heading>
          <Text style={{ margin: "0 0 16px", color: "#444" }}>
            Thank you for booking with KSTAY. Your reservation has been successfully confirmed.
          </Text>

          <Section style={{ border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px" }}>
            <Text style={{ margin: "0 0 8px" }}><strong>Listing:</strong> {props.listingTitle}</Text>
            {props.fullAddress && (
              <Text style={{ margin: "0 0 8px" }}><strong>Address:</strong> {props.fullAddress}</Text>
            )}
            <Text style={{ margin: "0 0 8px" }}><strong>Dates:</strong> {props.checkIn} - {props.checkOut}</Text>
            {(props.checkInTime || props.checkOutTime) && (
              <Text style={{ margin: "0 0 8px" }}>
                <strong>Check-in / Check-out time:</strong> {props.checkInTime ?? "—"} / {props.checkOutTime ?? "—"}
              </Text>
            )}
            <Text style={{ margin: "0 0 8px" }}><strong>Guests:</strong> {props.guestsText}</Text>
            <Text style={{ margin: "0 0 8px" }}><strong>Total:</strong> {props.totalText}</Text>
            <Text style={{ margin: "0" }}>
              <strong>Free cancellation until:</strong> {props.cancellationDeadlineKst}
            </Text>
          </Section>

          {props.checkInGuide && (
            <Section style={{ marginTop: "16px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px" }}>
              <Text style={{ margin: "0 0 8px", fontWeight: 600 }}>Check-in instructions</Text>
              <Text style={{ margin: 0, whiteSpace: "pre-wrap", color: "#444" }}>{props.checkInGuide}</Text>
            </Section>
          )}
          {props.houseRules && (
            <Section style={{ marginTop: "16px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px" }}>
              <Text style={{ margin: "0 0 8px", fontWeight: 600 }}>House rules &amp; info</Text>
              <Text style={{ margin: 0, whiteSpace: "pre-wrap", color: "#444" }}>{props.houseRules}</Text>
            </Section>
          )}

          <Text style={{ margin: "16px 0 8px", color: "#444" }}>
            You can review your booking details any time:
          </Text>
          <Link href={props.manageUrl}>{props.manageUrl}</Link>

          <Text style={{ marginTop: "20px", color: "#777", fontSize: "12px" }}>
            This is an automated email from KSTAY.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
