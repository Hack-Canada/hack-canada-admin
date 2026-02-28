import {
  Body,
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

type Props = {
  name: string;
  userId: string;
};

const OnboardingEmail = ({ name, userId }: Props) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(userId)}`;

  return (
    <Html>
      <Preview>🎉 Welcome to Hack Canada</Preview>
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
            backgroundColor: "#FFF5F5",
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
                  color: "#5D2E46",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 16px 0",
                  textAlign: "center" as const,
                }}
              >
                Welcome, {name}! 🎉
              </Heading>

              {/* TODO: Add onboarding content */}

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
                  color: "#5D2E46",
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
                  "linear-gradient(90deg, #F8BBD0, #FFB74D, #CE93D8)",
                borderRadius: "0 0 12px 12px",
                marginTop: "-4px",
              }}
            />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OnboardingEmail;
