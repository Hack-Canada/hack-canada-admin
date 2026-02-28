import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";
import { hackathonYear } from "@/config/site";

const ReminderEmail = () => (
  <Html>
    <Preview>URGENT: Applications Closing Soon</Preview>
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
          backgroundColor: "#F5F3FF",
          margin: 0,
          padding: 0,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "20px 0" }}
        >
          <Section
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              padding: "40px 32px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Heading
              style={{
                color: "#5B21B6",
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                textAlign: "center" as const,
              }}
            >
              Applications Closing Soon ⏰
            </Heading>

            {/* TODO: Add reminder content */}

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
                color: "#5B21B6",
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
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default ReminderEmail;
