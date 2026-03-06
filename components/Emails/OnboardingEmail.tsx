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

type Props = {
  name: string;
  userId: string;
};

const OnboardingEmail = ({ name, userId }: Props) => {
  return (
    <Html>
      <Preview>Important Links and Information for Hack Canada 2026</Preview>
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
            <Img
              src="https://i.imgur.com/JxmAG2V.jpeg"
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
                  color: "#5D2E46",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 16px 0",
                  textAlign: "center" as const,
                }}
              >
                Hey {name}! 👋
              </Heading>

              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 16px 0",
                }}
              >
                We&apos;re so excited to have you at Hack Canada 2026! The event
                is just around the corner, and we wanted to share some important
                links and information to help you prepare.
              </Text>

              <Hr
                style={{
                  border: "none",
                  borderTop: "1px solid #E5E7EB",
                  margin: "24px 0",
                }}
              />

              <Heading
                style={{
                  color: "#1F2937",
                  fontSize: "20px",
                  fontWeight: "600",
                  margin: "0 0 16px 0",
                }}
              >
                🔗 Important Links
              </Heading>

              <Section
                style={{
                  background: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)",
                  border: "2px solid #FECACA",
                  borderRadius: "12px",
                  padding: "24px",
                  margin: "0 0 24px 0",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <Text
                    style={{
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: "0 0 4px 0",
                    }}
                  >
                    📅 Event Schedule
                  </Text>
                  <Link
                    href="https://app.hackcanada.org/schedule"
                    style={{
                      color: "#DC2626",
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    app.hackcanada.org/schedule
                  </Link>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <Text
                    style={{
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: "0 0 4px 0",
                    }}
                  >
                    💬 Discord Server
                  </Text>
                  <Link
                    href="https://discord.gg/3R77baUg"
                    style={{
                      color: "#DC2626",
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    discord.gg/3R77baUg
                  </Link>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <Text
                    style={{
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: "0 0 4px 0",
                    }}
                  >
                    🚀 Devpost (Project Submissions)
                  </Text>
                  <Link
                    href="https://hack-canada-2026.devpost.com/"
                    style={{
                      color: "#DC2626",
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    hack-canada-2026.devpost.com
                  </Link>
                </div>

                <div>
                  <Text
                    style={{
                      color: "#1F2937",
                      fontSize: "14px",
                      fontWeight: "600",
                      margin: "0 0 4px 0",
                    }}
                  >
                    📖 Hacker Package
                  </Text>
                  <Link
                    href="https://hack-canada-2026.notion.site/Hack-Canada-2026-Hacker-Package-2de5d88c3a2180aaa469e760de714317#3165d88c3a2180fa9fc0e4f75ebf34e0"
                    style={{
                      color: "#DC2626",
                      fontSize: "14px",
                      textDecoration: "underline",
                    }}
                  >
                    View Hacker Package
                  </Link>
                </div>
              </Section>

              <Hr
                style={{
                  border: "none",
                  borderTop: "1px solid #E5E7EB",
                  margin: "24px 0",
                }}
              />

              <Heading
                style={{
                  color: "#1F2937",
                  fontSize: "20px",
                  fontWeight: "600",
                  margin: "0 0 16px 0",
                }}
              >
                💬 Join Our Discord Server!
              </Heading>

              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 16px 0",
                }}
              >
                Our Discord server is the central hub for all event
                communication. Join now to:
              </Text>

              <ul
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 16px 0",
                  paddingLeft: "24px",
                }}
              >
                <li>Connect with other hackers and find teammates</li>
                <li>Get real-time announcements and updates</li>
                <li>Ask questions and get help from mentors</li>
                <li>Participate in mini-events and activities</li>
              </ul>

              <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
                <Button
                  href="https://discord.gg/3R77baUg"
                  style={{
                    backgroundColor: "#5865F2",
                    color: "#FFFFFF",
                    fontSize: "16px",
                    fontWeight: "600",
                    textDecoration: "none",
                    display: "inline-block",
                    padding: "12px 32px",
                    borderRadius: "8px",
                  }}
                >
                  Join Discord Server
                </Button>
              </div>

              <Hr
                style={{
                  border: "none",
                  borderTop: "1px solid #E5E7EB",
                  margin: "24px 0",
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
                Make sure to bookmark these links and join our Discord as soon
                as possible. We&apos;ll be sharing more updates and important
                information there leading up to the event!
              </Text>

              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 16px 0",
                }}
              >
                If you have any questions, feel free to reach out to us at{" "}
                <a
                  href="mailto:hi@hackcanada.org"
                  style={{ color: "#5D2E46", textDecoration: "underline" }}
                >
                  hi@hackcanada.org
                </a>{" "}
                or ask in our Discord server.
              </Text>

              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "28px 0 4px 0",
                }}
              >
                See you soon!
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
                    href="https://discord.gg/3R77baUg"
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
