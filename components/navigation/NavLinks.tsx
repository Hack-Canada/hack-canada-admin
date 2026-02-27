import { navLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Clipboard,
  Gavel,
  Target,
  UserCheck,
  CalendarCheck,
  ScanLine,
  Mail,
  Calendar,
  Settings,
} from "lucide-react";
import { useSession } from "next-auth/react";

const iconMap = {
  Home: LayoutDashboard,
  Users: Users,
  Applications: Clipboard,
  Statistics: BarChart3,
  "Review Applications": Gavel,
  "Reviewer Leaderboards": BarChart3,
  "Role Management": ShieldCheck,
  Logs: ScrollText,
  "Reviewer Stats": UserCheck,
  "Challenge Management": Target,
  "RSVP Management": CalendarCheck,
  "Check-Ins": ScanLine,
  Emails: Mail,
  Schedule: Calendar,
  Settings: Settings,
};

interface NavLinksProps {
  isMinimized: boolean;
  onNavigate?: () => void;
}

const NavLinks = ({ isMinimized, onNavigate }: NavLinksProps) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const isAdmin = userRole === "admin";

  return (
    <ul className="w-full space-y-2 pb-8">
      {navLinks
        .filter((link) => {
          if (link.roles) return userRole ? link.roles.includes(userRole) : false;
          return !link.adminOnly || isAdmin;
        })
        .map((link) => {
          const Icon = iconMap[link.name as keyof typeof iconMap];

          return (
            <li
              key={link.name}
              className={cn(
                "flex rounded-lg border border-border/75 bg-muted/50 text-foreground/70 transition-[background-color,color] duration-200",
                {
                  "hover:bg-primary/10 hover:text-foreground": true,
                  "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground":
                    pathname === link.href,
                },
              )}
            >
              <Link
                className={cn(
                  "flex w-full items-center px-4 py-2.5",
                  isMinimized ? "" : "gap-3",
                )}
                href={link.href}
                onClick={onNavigate}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "shrink-0 transition-[width,height]",
                      isMinimized ? "size-[22px]" : "size-[18px]",
                    )}
                  />
                )}
                <span
                  className={cn(
                    "origin-left text-nowrap font-medium transition-[transform,opacity]",
                    isMinimized
                      ? "scale-x-0 opacity-0 duration-150"
                      : "scale-x-100 opacity-100 delay-75 duration-200",
                  )}
                >
                  {link.name}
                </span>
              </Link>
            </li>
          );
        })}
    </ul>
  );
};

export default NavLinks;
