import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

type Props = {
  bookingToken: string;
  listingTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guestsText: string;
  accommodationKrwFormatted: string;
  guestServiceFeeKrwFormatted: string;
  totalKrwFormatted: string;
  totalUsdFormatted: string;
  cancellationDeadlineKst: string;
  manageUrl: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInGuide?: string;
  houseRules?: string;
  fullAddress?: string;
};

const rowStyle = { margin: "8px 0", display: "flex", justifyContent: "space-between", gap: "16px" as const };
const labelStyle = { color: "#666", margin: 0 };
const valueStyle = { margin: 0, textAlign: "right" as const };

export default function BookingConfirmedEmail(props: Props) {
  return (
    <Html>
      <Head />
      <Preview>KSTAY 예약 확정 / Your booking is confirmed</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Arial, sans-serif", padding: "20px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", maxWidth: "560px" }}>
          <Heading style={{ margin: "0 0 8px", fontSize: "22px" }}>예약 확정 / Booking confirmed</Heading>
          <Text style={{ margin: "0 0 20px", color: "#444", fontSize: "14px" }}>
            KSTAY 예약이 확정되었습니다. 아래 청구 내역을 확인해 주세요. / Thank you for booking with KSTAY.
          </Text>

          <Section style={{ border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <Text style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px" }}>예약 정보 / Reservation</Text>
            <div style={rowStyle}>
              <p style={labelStyle}>숙소</p>
              <p style={valueStyle}>{props.listingTitle}</p>
            </div>
            {props.fullAddress && (
              <div style={rowStyle}>
                <p style={labelStyle}>주소</p>
                <p style={{ ...valueStyle, maxWidth: "60%" }}>{props.fullAddress}</p>
              </div>
            )}
            <div style={rowStyle}>
              <p style={labelStyle}>체크인 – 체크아웃</p>
              <p style={valueStyle}>{props.checkIn} – {props.checkOut} ({props.nights}박)</p>
            </div>
            {(props.checkInTime || props.checkOutTime) && (
              <div style={rowStyle}>
                <p style={labelStyle}>체크인/아웃 시간</p>
                <p style={valueStyle}>{props.checkInTime ?? "—"} / {props.checkOutTime ?? "—"}</p>
              </div>
            )}
            <div style={rowStyle}>
              <p style={labelStyle}>인원</p>
              <p style={valueStyle}>{props.guestsText}</p>
            </div>
          </Section>

          <Section style={{ border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
            <Text style={{ margin: "0 0 12px", fontWeight: 600, fontSize: "14px" }}>청구 내역 / Payment summary</Text>
            <Hr style={{ borderColor: "#eee", margin: "8px 0" }} />
            <div style={rowStyle}>
              <p style={labelStyle}>숙박료 ({props.nights}박)</p>
              <p style={valueStyle}>{props.accommodationKrwFormatted}</p>
            </div>
            <div style={rowStyle}>
              <p style={labelStyle}>게스트 서비스 수수료 (세금 포함)</p>
              <p style={valueStyle}>{props.guestServiceFeeKrwFormatted}</p>
            </div>
            <Hr style={{ borderColor: "#eee", margin: "8px 0" }} />
            <div style={{ ...rowStyle, fontWeight: 600, fontSize: "15px" }}>
              <p style={{ ...labelStyle, fontWeight: 600 }}>총 결제금액 / Total</p>
              <p style={valueStyle}>{props.totalKrwFormatted} ({props.totalUsdFormatted})</p>
            </div>
            <Text style={{ margin: "12px 0 0", fontSize: "12px", color: "#666" }}>
              무료 취소: {props.cancellationDeadlineKst} 까지
            </Text>
          </Section>

          {(props.checkInGuide || props.houseRules) && (
            <Section style={{ marginTop: "16px", border: "1px solid #e5e5e5", borderRadius: "10px", padding: "16px" }}>
              <Text style={{ margin: "0 0 8px", fontWeight: 600 }}>예약 확정 후 전달 안내 / Check-in &amp; house rules</Text>
              <Text style={{ margin: 0, whiteSpace: "pre-wrap", color: "#444" }}>
                {props.checkInGuide && props.houseRules && props.checkInGuide === props.houseRules
                  ? props.checkInGuide
                  : [props.checkInGuide, props.houseRules].filter(Boolean).join("\n\n")}
              </Text>
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
