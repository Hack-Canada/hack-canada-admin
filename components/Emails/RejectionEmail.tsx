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

const RejectionEmail = ({ name }: Props) => (
  <Html>
    <Preview>Thank You for Your Application to Hack Canada</Preview>
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
          backgroundColor: "#F0F4F8",
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
            src="https://hackcanada.org/email-headers/hack_canada_rejection_header.png"
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
                color: "#475569",
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                textAlign: "center" as const,
              }}
            >
              Hello {name},
            </Heading>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              We truly loved reading your application. We loved seeing all the
              passion, creativity and love that you put into your application to
              Hack Canada.
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              We wish we could bring everyone who applied to our hackathon, but
              unfortunately, that&apos;s just not possible. We regret to inform
              you that we are unable to offer you a spot at this time.
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              We hope to see you at our future events. Furthermore, if
              interested, we encourage you to apply as a mentor!
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              Keep building, innovating, and solving problems—qualities that
              make the hackathon community so vibrant and inspiring!
            </Text>

            <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button
                href="https://app.hackcanada.org/applications/hacker/review"
                style={{
                  backgroundColor: "#475569",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "12px 32px",
                  borderRadius: "8px",
                }}
              >
                Review Application
              </Button>
            </div>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "16px 0 0 0",
              }}
            >
              If you have any questions or would like to stay connected, feel
              free to reach out to us at{" "}
              <a
                href="mailto:hi@hackcanada.org"
                style={{ color: "#1F2937", textDecoration: "underline" }}
              >
                hi@hackcanada.org
              </a>
              . Be sure to follow us on{" "}
              <a
                href="https://instagram.com/hackcanada"
                style={{ color: "#1F2937", textDecoration: "underline" }}
              >
                Instagram
              </a>{" "}
              and{" "}
              <a
                href="https://www.linkedin.com/company/hack-canada"
                style={{ color: "#1F2937", textDecoration: "underline" }}
              >
                LinkedIn
              </a>{" "}
              for updates on upcoming events and resources for hackers.
            </Text>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "16px 0 0 0",
              }}
            >
              Thank you once again for your interest in Hack Canada. We wish you
              all the best in your future endeavours!
            </Text>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "28px 0 4px 0",
              }}
            >
              Cheers,
            </Text>
            <Text
              style={{
                color: "#475569",
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
                <Link
                  href="https://hackcanada.org"
                  target="_blank"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "12px",
                    textDecoration: "none",
                    margin: "0 6px",
                  }}
                >
                  Website
                </Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link
                  href="https://app.hackcanada.org"
                  target="_blank"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "12px",
                    textDecoration: "none",
                    margin: "0 6px",
                  }}
                >
                  Dashboard
                </Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link
                  href="https://discord.gg/YpYeJPvUvU"
                  target="_blank"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "12px",
                    textDecoration: "none",
                    margin: "0 6px",
                  }}
                >
                  Discord
                </Link>
                <span style={{ color: "#D1D5DB" }}>·</span>
                <Link
                  href="mailto:hi@hackcanada.org"
                  style={{
                    color: "#9CA3AF",
                    fontSize: "12px",
                    textDecoration: "none",
                    margin: "0 6px",
                  }}
                >
                  Contact
                </Link>
              </div>
              <Text
                style={{
                  color: "#9CA3AF",
                  fontSize: "12px",
                  lineHeight: "18px",
                  margin: "4px 0 0 0",
                }}
              >
                © {hackathonYear} Hack Canada. All rights reserved.
              </Text>
            </div>
          </Section>

          <div
            style={{
              height: "4px",
              background:
                "linear-gradient(90deg, #BAE6FD, #93C5FD, #60A5FA, #3B82F6)",
              borderRadius: "0 0 12px 12px",
              marginTop: "-4px",
            }}
          />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default RejectionEmail;
