import { formatDate, getResumeUrl } from "@/lib/utils";
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  School,
  FileCheck,
  GraduationCap,
  Globe,
  Github,
  Linkedin,
  ExternalLink,
  Link as LinkIcon,
  CircleUserRound,
  Flag,
  BookOpen,
  MessageSquare,
  PenBox,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EmptyValue = ({ className }: { className?: string }) => (
  <span
    className={cn(
      "rounded-md bg-muted/50 px-1.5 py-0.5 text-xs font-medium text-muted-foreground",
      className,
    )}
  >
    [EMPTY]
  </span>
);
import Link from "next/link";
import { HackerApplicationsSelectData } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InfoRow from "./InfoRow";

type Props = {
  hacker: HackerApplicationsSelectData | null;
  hideBackgroundInfo?: boolean;
};

const ApplicationInfo = ({ hacker, hideBackgroundInfo }: Props) => {
  if (!hacker) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="pt-6">
          <p className="text-center text-destructive">
            Could not find a hacker with the given ID.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-background via-background/80 to-background">
      <CardHeader>
        <CardTitle className="text-xl font-semibold tracking-tight">
          Application Information
        </CardTitle>
      </CardHeader>
      <hr className="mb-4" />
      <CardContent>
        <div className="grid w-full gap-y-3">
          {/* Personal Information */}
          <h3 className="mt-2 text-lg font-semibold">Personal Information</h3>
          {!hideBackgroundInfo && (
            <InfoRow
              label="ID"
              value={hacker.id}
              icon={<UserIcon className="size-4" />}
            />
          )}
          <InfoRow
            label="Name"
            value={
              hacker.firstName || hacker.lastName ? (
                `${hacker.firstName || ""} ${hacker.lastName || ""}`.trim()
              ) : (
                <EmptyValue />
              )
            }
            icon={<UserIcon className="size-4" />}
          />
          <InfoRow
            label="Email"
            value={hacker.email || <EmptyValue />}
            icon={<Mail className="size-4" />}
          />
          <InfoRow
            label="Age"
            value={hacker.age?.toString() || <EmptyValue />}
            icon={<CircleUserRound className="size-4" />}
          />
          {!hideBackgroundInfo && (
            <InfoRow
              label="Phone Number"
              value={hacker.phoneNumber || <EmptyValue />}
              icon={<Phone className="size-4" />}
            />
          )}
          {!hideBackgroundInfo && (
            <InfoRow
              label="Pronouns"
              value={hacker.pronouns || <EmptyValue />}
              icon={<CircleUserRound className="size-4" />}
            />
          )}
          {!hideBackgroundInfo && (
            <InfoRow
              label="Gender"
              value={hacker.gender || <EmptyValue />}
              icon={<CircleUserRound className="size-4" />}
            />
          )}
          {!hideBackgroundInfo && (
            <InfoRow
              label="Race/Ethnicity"
              value={hacker.race || <EmptyValue />}
              icon={<Flag className="size-4" />}
            />
          )}

          {!hideBackgroundInfo && (
            <InfoRow
              label="Country"
              value={hacker.country || <EmptyValue />}
              icon={<Globe className="size-4" />}
            />
          )}

          {/* Education Information */}
          <h3 className="mt-4 text-lg font-semibold">Education</h3>
          <InfoRow
            label="School"
            value={hacker.school || <EmptyValue />}
            icon={<School className="size-4" />}
          />
          <InfoRow
            label="Level of Study"
            value={hacker.levelOfStudy || <EmptyValue />}
            icon={<GraduationCap className="size-4" />}
          />
          <InfoRow
            label="Major"
            value={hacker.major || <EmptyValue />}
            icon={<BookOpen className="size-4" />}
          />
          <InfoRow
            label="Graduation Year"
            value={hacker.graduationYear?.toString() || <EmptyValue />}
            icon={<Calendar className="size-4" />}
          />

          {/* Links & Social */}
          <h3 className="mt-4 text-lg font-semibold">Links & Social</h3>
          <InfoRow
            label="GitHub"
            value={
              hacker.github ? (
                <Link
                  href={hacker.github}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  View Profile <ExternalLink className="size-4" />
                </Link>
              ) : (
                <EmptyValue />
              )
            }
            icon={<Github className="size-4" />}
          />
          <InfoRow
            label="LinkedIn"
            value={
              hacker.linkedin ? (
                <Link
                  href={hacker.linkedin}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  View Profile <ExternalLink className="size-4" />
                </Link>
              ) : (
                <EmptyValue />
              )
            }
            icon={<Linkedin className="size-4" />}
          />
          <InfoRow
            label="Personal Website"
            value={
              hacker.personalWebsite ? (
                <Link
                  href={hacker.personalWebsite}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  Visit Website <ExternalLink className="size-4" />
                </Link>
              ) : (
                <EmptyValue />
              )
            }
            icon={<LinkIcon className="size-4" />}
          />
          <InfoRow
            label="Resume"
            value={
              hacker.resumeUrl ? (
                <Link
                  href={getResumeUrl(hacker.resumeUrl)}
                  target="_blank"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 transition-colors hover:text-primary/80 hover:underline"
                >
                  View Resume <ExternalLink className="size-4" />
                </Link>
              ) : (
                <EmptyValue />
              )
            }
            icon={<FileSpreadsheet className="size-4" />}
          />
          {!hideBackgroundInfo && (
            <InfoRow
              label="Share Resume"
              value={hacker.shareResume ? "Yes" : "No"}
              icon={<FileCheck className="size-4" />}
            />
          )}

          {/* Experience */}
          <h3 className="mt-4 text-lg font-semibold">Experience</h3>
          <InfoRow
            label="Technical Interests"
            value={hacker.technicalInterests || <EmptyValue />}
            icon={<PenBox className="size-4" />}
          />
          <InfoRow
            label="Hackathons Attended"
            value={hacker.hackathonsAttended || <EmptyValue />}
            icon={<Calendar className="size-4" />}
          />

          {/* Short Answer Questions */}
          <h3 className="mt-4 text-lg font-semibold">Short Answers</h3>
          <InfoRow
            label="What's the coolest project you've ever built? Every project has a story. What problem were you trying to solve, and how does your creation tackle it? Take us behind the scenes, what technologies power it, what obstacles did you face, and what 'aha' moments got you through? Share your links (GitHub, demo, video, etc.) so we can see it in action"
            value={
              hacker.shortAnswer1 || (
                <EmptyValue className="text-base md:text-lg" />
              )
            }
            icon={<MessageSquare className="size-4" />}
            longAnswer
          />
          <InfoRow
            label="What would help you most in continuing your project after the hackathon? (e.g., one-on-one meetings with sponsors, mentorship, cloud credits, introductions to investors or partners, additional prizes, incubator access, or technical support)"
            value={
              hacker.shortAnswer2 || (
                <EmptyValue className="text-base md:text-lg" />
              )
            }
            icon={<MessageSquare className="size-4" />}
            longAnswer
          />
          <InfoRow
            label="How would you describe your 'builder style'? (e.g., The Architect who structures the logic, The Sprinter who writes the code, The Strategist who connects the project to the ecosystem, or The Polymath who fills the gaps)"
            value={
              hacker.shortAnswer3 || (
                <EmptyValue className="text-base md:text-lg" />
              )
            }
            icon={<MessageSquare className="size-4" />}
            longAnswer
          />

          {/* Application Status */}
          {!hideBackgroundInfo && (
            <>
              <h3 className="mt-4 text-lg font-semibold">
                Application Details
              </h3>
              <InfoRow
                label="Submission Status"
                value={hacker.submissionStatus || <EmptyValue />}
                icon={<Clock className="size-4" />}
              />
              <InfoRow
                label="Internal Result"
                value={hacker.internalResult || <EmptyValue />}
                icon={<FileCheck className="size-4" />}
              />
              <InfoRow
                label="Created At"
                value={formatDate(hacker.createdAt.toString())}
                icon={<Calendar className="size-4" />}
              />
              <InfoRow
                label="Last Updated"
                value={formatDate(hacker.updatedAt.toString())}
                icon={<Calendar className="size-4" />}
              />
              {hacker.internalNotes && (
                <InfoRow
                  label="Internal Notes"
                  value={hacker.internalNotes}
                  icon={<MessageSquare className="size-4" />}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationInfo;
