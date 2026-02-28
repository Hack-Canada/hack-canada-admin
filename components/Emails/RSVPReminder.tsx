import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { hackathonYear } from "@/config/site";

type Props = { name: string };

const RSVPReminder = ({ name }: Props) => (
  <Html>
    <Preview>
      🚨 Final RSVP Reminder - Please Respond by Tonight for Hack Canada
    </Preview>
    <Tailwind
      config={{
        theme: {
          extend: {
            colors: {
              primary: "#1E90FF",
              primaryDark: "#1565C0",
              background: "#FFFFFF",
              backgroundMuted: "#F8FAFC",
              textPrimary: "#1F2937",
              textSecondary: "#4B5563",
              textMuted: "#9CA3AF",
            },
          },
        },
      }}
    >
      <Head />
      <Body
        style={{
          backgroundColor: "#FEF2F2",
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 0" }}
        >
          <Img
            src="https://i.imgur.com/N36vrSu.png"
            width="600"
            alt="Hack Canada Banner"
            style={{
              width: "100%",
              maxWidth: "600px",
              height: "auto",
              display: "block",
              borderRadius: "12px 12px 0 0",
            }}
          />

          <Section
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "0 0 12px 12px",
              padding: "40px 32px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Heading
              style={{
                color: "#DC2626",
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                textAlign: "center" as const,
              }}
            >
              🚨 Final RSVP Reminder
            </Heading>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              Hi {name},
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              We noticed you haven&apos;t confirmed your spot for Hack Canada
              happening tomorrow! We need your immediate response to ensure we can
              accommodate everyone properly.
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                fontWeight: "600",
                margin: "0 0 24px 0",
              }}
            >
              Please RSVP by tonight (March 5th, 2026 at 11:59 PM EST) if you
              would still like to join us for the hackathon. If we don&apos;t hear
              back from you, we may have to release your spot to someone on the
              waitlist.
            </Text>

            <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button
                href="https://app.hackcanada.org/rsvp"
                style={{
                  backgroundColor: "#0A1F44",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "12px 32px",
                  borderRadius: "8px",
                  marginRight: "12px",
                }}
              >
                RSVP Now
              </Button>
              <Button
                href="https://app.hackcanada.org"
                style={{
                  backgroundColor: "#DC2626",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "12px 32px",
                  borderRadius: "8px",
                }}
              >
                Cancel RSVP
              </Button>
            </div>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E5E7EB",
                margin: "32px 0",
              }}
            />

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              Just a reminder that Hack Canada is happening tomorrow at SPUR
              Campus - Spur Innovation Center (2240 University Ave, Waterloo).
              Check-ins start at 4:00 PM!
            </Text>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              If you have decided not to attend Hack Canada, please use the Cancel
              RSVP button above to let us know before 11:59 PM EST on March 5th. This
              will help us offer your spot to someone on our waitlist who is eager
              to participate.
            </Text>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              If you have any questions or issues, please reach out to us
              immediately at{" "}
              <Link
                href="mailto:hi@hackcanada.org"
                style={{ color: "#1F2937", textDecoration: "underline" }}
              >
                hi@hackcanada.org
              </Link>
            </Text>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "28px 0 4px 0",
              }}
            >
              Best regards,
            </Text>
            <Text
              style={{
                color: "#DC2626",
                fontSize: "16px",
                fontWeight: "600",
                margin: "0",
              }}
            >
              The Hack Canada Team
            </Text>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E5E7EB",
                margin: "32px 0",
              }}
            />

            <div style={{ textAlign: "center" as const }}>
              <div style={{ marginBottom: "8px" }}>
                <Link href="https://hackcanada.org" target="_blank" style={{ color: "#9CA3AF", fontSize: "12px", textDecoration: "none", margin: "0 6px" }}>Website</Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link href="https://app.hackcanada.org" target="_blank" style={{ color: "#9CA3AF", fontSize: "12px", textDecoration: "none", margin: "0 6px" }}>Dashboard</Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link href="https://discord.gg/YpYeJPvUvU" target="_blank" style={{ color: "#9CA3AF", fontSize: "12px", textDecoration: "none", margin: "0 6px" }}>Discord</Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link href="mailto:hi@hackcanada.org" style={{ color: "#9CA3AF", fontSize: "12px", textDecoration: "none", margin: "0 6px" }}>Contact</Link>
              </div>
              <Text style={{ color: "#9CA3AF", fontSize: "12px", lineHeight: "18px", margin: "4px 0 0 0" }}>
                © {hackathonYear} Hack Canada. All rights reserved.
              </Text>
            </div>
          </Section>

          <div
            style={{
              height: "4px",
              background:
                "linear-gradient(90deg, #FCA5A5, #F87171, #EF4444, #DC2626)",
              borderRadius: "0 0 12px 12px",
              marginTop: "-4px",
            }}
          />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default RSVPReminder;
