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
            <Text style={{ margin: "0 0 8px" }}><strong>Booking token:</strong> {props.bookingToken}</Text>
            <Text style={{ margin: "0 0 8px" }}><strong>Listing:</strong> {props.listingTitle}</Text>
            <Text style={{ margin: "0 0 8px" }}><strong>Dates:</strong> {props.checkIn} - {props.checkOut}</Text>
            <Text style={{ margin: "0 0 8px" }}><strong>Guests:</strong> {props.guestsText}</Text>
            <Text style={{ margin: "0 0 8px" }}><strong>Total:</strong> {props.totalText}</Text>
            <Text style={{ margin: "0" }}>
              <strong>Free cancellation until:</strong> {props.cancellationDeadlineKst}
            </Text>
          </Section>

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
