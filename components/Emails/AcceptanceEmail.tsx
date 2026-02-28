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

const AcceptanceEmail = ({ name }: Props) => (
  <Html>
    <Preview>
      [ACTION REQUIRED] Congratulations, you have been accepted to Hack Canada
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
              backgroundColor: "#FEF3C7",
              border: "2px solid #F59E0B",
              borderRadius: "8px",
              padding: "16px 24px",
              margin: "12px 0",
            }}
          >
            <Text
              style={{
                color: "#92400E",
                fontSize: "14px",
                fontWeight: "700",
                margin: "0 0 4px 0",
              }}
            >
              ⚠️ Please disregard our previous email
            </Text>
            <Text
              style={{
                color: "#92400E",
                fontSize: "14px",
                lineHeight: "22px",
                margin: "0",
              }}
            >
              We accidentally sent an outdated email earlier — please ignore it.
              This is the correct and official acceptance email for Hack Canada {hackathonYear}. We apologize for any confusion!
            </Text>
          </Section>

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
                color: "#5B21B6",
                fontSize: "28px",
                fontWeight: "700",
                margin: "0 0 16px 0",
                textAlign: "center" as const,
              }}
            >
              🎉 Congratulations, {name}! 🎉
            </Heading>

            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              After an intense application process... We would like to
              congratulate you on making it through!{" "}
              <strong>
                Also, that previous message? Pretend it never happened. Technical
                chaos ensued, and we&apos;d rather not talk about it.
              </strong>
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              This year we had sooo many applicants and the process was not
              easy. We found your application to stand out above the rest, like
              a rose in a dandelion field. Your creativity and passion were so
              strong, we could sense it from a mile away.
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              We would love to have you at Hack Canada, and we can&apos;t wait
              to see what amazing things you can build with us!
            </Text>

            <Section
              style={{
                background: "linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)",
                border: "2px solid #DDD6FE",
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
                Event Details
              </Text>
              <div
                style={{
                  color: "#4B5563",
                  fontSize: "16px",
                  lineHeight: "26px",
                }}
              >
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ marginBottom: "4px" }}>
                    <strong
                      style={{
                        color: "#1F2937",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      📍 WHERE
                    </strong>
                  </div>
                  <div>
                    SPUR Campus - Spur Innovation Center,
                    <br />
                    2240 University Ave,
                    <br />
                    Waterloo, ON N2K 0G3
                  </div>
                </div>
                <div>
                  <div style={{ marginBottom: "4px" }}>
                    <strong
                      style={{
                        color: "#1F2937",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      📅 WHEN
                    </strong>
                  </div>
                  <div>March 6-8, 2026</div>
                </div>
              </div>
            </Section>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E5E7EB",
                margin: "32px 0",
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
              What&apos;s Next?
            </Heading>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              To make sure you&apos;re gonna be on our list of super cool
              people, we need you to{" "}
              <strong>RSVP within 7 days of receiving this email.</strong> We
              also have some additional questions to make sure everything is
              perfect for you.
            </Text>

            <div style={{ textAlign: "center" as const, margin: "24px 0" }}>
              <Button
                href="https://app.hackcanada.org/rsvp"
                style={{
                  backgroundColor: "#5B21B6",
                  color: "#FFFFFF",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  padding: "12px 32px",
                  borderRadius: "8px",
                }}
              >
                RSVP Now
              </Button>
            </div>

            <Hr
              style={{
                border: "none",
                borderTop: "1px solid #E5E7EB",
                margin: "32px 0",
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
              Stay tuned for more details!
            </Heading>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              At this moment we are still hammering out some of the logistics,
              but event schedule, discord server, team formation information,
              and other exciting updates will be shared with you closer to the
              hackathon date!
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "0 0 16px 0",
              }}
            >
              If you have any questions or need anything, feel free to reach out
              to us at{" "}
              <a
                href="mailto:hi@hackcanada.org"
                style={{ color: "#1F2937", textDecoration: "underline" }}
              >
                hi@hackcanada.org
              </a>{" "}
              — we&apos;re happy to assist!
            </Text>
            <Text
              style={{
                color: "#4B5563",
                fontSize: "16px",
                lineHeight: "26px",
                margin: "16px 0 0 0",
              }}
            >
              We can&apos;t wait to see you!
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
                "linear-gradient(90deg, #A78BFA, #C084FC, #F472B6, #FB923C)",
              borderRadius: "0 0 12px 12px",
              marginTop: "-4px",
            }}
          />
        </Container>
      </Body>
    </Tailwind>
  </Html>
);

export default AcceptanceEmail;
