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

const HackathonPrepEmail = ({ name, userId }: Props) => {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `https://app.hackcanada.org/profile/${userId}`,
  )}`;

  return (
    <Html>
      <Preview>
        🚀 Hack Canada Event Details and Check-in Information - 2026
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
            backgroundColor: "#F9FAFB",
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
              src="https://hackcanada.org/email-headers/hack_canada_congrats_header.png"
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
                  color: "#1E90FF",
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0 0 16px 0",
                  textAlign: "center" as const,
                }}
              >
                Hello {name}! 👋
              </Heading>

              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 16px 0",
                }}
              >
                We&apos;re getting closer to the big day! Here&apos;s everything
                you need to know about Hack Canada, taking place at SPUR Campus
                in Waterloo this weekend.
              </Text>

              <Section
                style={{
                  background:
                    "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                  border: "2px solid #BFDBFE",
                  borderRadius: "12px",
                  padding: "24px",
                  margin: "0 0 32px 0",
                }}
              >
                <Text
                  style={{
                    color: "#1F2937",
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "0 0 16px 0",
                  }}
                >
                  📍 Location & Check-in Details
                </Text>
                <div
                  style={{
                    color: "#4B5563",
                    fontSize: "16px",
                    lineHeight: "26px",
                  }}
                >
                  <div style={{ marginBottom: "16px" }}>
                    <strong
                      style={{
                        color: "#1F2937",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      CHECK-IN TIME
                    </strong>
                    <div style={{ marginTop: "4px" }}>
                      Friday, March 6th, 4:00 PM — 6:30 PM
                    </div>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: "12px",
                        lineHeight: "18px",
                        margin: "4px 0 0 0",
                      }}
                    >
                      If you&apos;re going to be late, please message us in the
                      #ask-an-organizer channel on Discord or find an organizer
                      during the event once you&apos;ve arrived.
                    </Text>
                  </div>
                  <div>
                    <strong
                      style={{
                        color: "#1F2937",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      VENUE ADDRESS
                    </strong>
                    <div style={{ marginTop: "4px" }}>
                      SPUR Campus - Spur Innovation Center
                      <br />
                      2240 University Ave, Waterloo, ON N2K 0G3
                    </div>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: "12px",
                        lineHeight: "18px",
                        margin: "4px 0 0 0",
                      }}
                    >
                      Note: Parking is available at the venue.
                    </Text>
                  </div>
                </div>
              </Section>

              <Heading
                style={{
                  color: "#0A1F44",
                  fontSize: "20px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                }}
              >
                🎫 Your Multi-Purpose QR Code
              </Heading>
              <Text
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                  margin: "0 0 8px 0",
                }}
              >
                This QR code is your digital key to the hackathon experience:
              </Text>
              <div
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "28px",
                  margin: "8px 0",
                }}
              >
                <div>• Use it for hackathon check-in and meal check-ins</div>
                <div>• Connect with other hackers during the event</div>
                <div>
                  • Access it anytime through your dashboard at
                  app.hackcanada.org
                </div>
              </div>
              <div
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "28px",
                  margin: "8px 0",
                }}
              >
                <strong style={{ color: "#1F2937" }}>Important Notes:</strong>
                <div style={{ marginTop: "4px" }}>
                  <div>
                    • Your badge must be worn at all times during the event
                  </div>
                  <div>
                    • High school students must bring a signed letter from their
                    guardian permitting attendance
                  </div>
                  <div>
                    • If you lose your badge, find an event organizer
                    immediately
                  </div>
                </div>
              </div>

              <div
                style={{
                  textAlign: "center" as const,
                  margin: "16px 0 32px 0",
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    backgroundColor: "#FFFFFF",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <Img
                    src={qrCodeUrl}
                    width="200"
                    height="200"
                    alt="Multi-Purpose QR Code"
                    style={{ display: "block" }}
                  />
                </div>
              </div>

              <Section
                style={{
                  background:
                    "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                  border: "2px solid #BFDBFE",
                  borderRadius: "12px",
                  padding: "24px",
                  margin: "0 0 32px 0",
                }}
              >
                <Heading
                  style={{
                    color: "#0A1F44",
                    fontSize: "20px",
                    fontWeight: "700",
                    margin: "0 0 8px 0",
                  }}
                >
                  🔗 Important Links & Resources
                </Heading>
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: "16px",
                    lineHeight: "26px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Please join our Discord server—it&apos;s where all important
                  announcements and communications will happen during the event:
                </Text>
                <div
                  style={{
                    textAlign: "center" as const,
                    margin: "8px 0 16px 0",
                  }}
                >
                  <Button
                    href="https://discord.gg/YpYeJPvUvU"
                    style={{
                      backgroundColor: "#0A1F44",
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

                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: "16px",
                    lineHeight: "26px",
                    margin: "16px 0 8px 0",
                  }}
                >
                  Other important links:
                </Text>
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: "16px",
                    lineHeight: "28px",
                    margin: "0",
                  }}
                >
                  •{" "}
                  <a
                    href="https://app.hackcanada.org"
                    style={{
                      color: "#1E90FF",
                      textDecoration: "underline",
                    }}
                  >
                    Hacker Dashboard
                  </a>{" "}
                  - Access your profile and event information
                  <br />•{" "}
                  <a
                    href="https://hack-canada-2026.devpost.com/"
                    style={{
                      color: "#1E90FF",
                      textDecoration: "underline",
                    }}
                  >
                    Devpost
                  </a>{" "}
                  - For project submissions (register and submit here!)
                </Text>
                <Text
                  style={{
                    color: "#6B7280",
                    fontSize: "14px",
                    lineHeight: "20px",
                    margin: "12px 0 0 0",
                  }}
                >
                  The Hacker Package and Event Schedule will be shared via
                  Discord, your Hacker Dashboard, and email closer to the event.
                  Keep an eye on both for the latest announcements!
                </Text>
              </Section>

              <Heading
                style={{
                  color: "#0A1F44",
                  fontSize: "20px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                }}
              >
                🎒 What to Bring
              </Heading>
              <div
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "32px",
                  margin: "8px 0",
                }}
              >
                <div>📸 Valid Photo ID (required for check-in)</div>
                <div>💻 Laptop & charger</div>
                <div>🔧 Any other devices or hardware you plan to use</div>
                <div>🧴 Toiletries & any medication you need</div>
                <div>
                  👕 Comfortable clothes and a light jacket (temperature varies)
                </div>
                <div>🛏️ Sleeping bag/blanket if you plan to rest</div>
                <div>🚰 Water bottle to stay hydrated</div>
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
                If you have any questions before the event, feel free to reach
                out to us at{" "}
                <a
                  href="mailto:hi@hackcanada.org"
                  style={{ color: "#1F2937", textDecoration: "underline" }}
                >
                  hi@hackcanada.org
                </a>{" "}
                or message us on Discord.
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
                  color: "#1E90FF",
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
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default HackathonPrepEmail;
