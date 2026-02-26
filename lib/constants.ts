export const RESULTS_PER_PAGE = 25;

type NavigationLink = {
  name: string;
  href: string;
  adminOnly?: boolean;
};

export const navLinks: NavigationLink[] = [
  {
    name: "Home",
    href: "/",
  },
  {
    name: "Users",
    href: "/users",
    adminOnly: true,
  },
  {
    name: "Applications",
    href: "/applications",
    adminOnly: true,
  },
  {
    name: "Statistics",
    href: "/statistics",
    adminOnly: true,
  },
  {
    name: "Review Applications",
    href: "/review-applications",
  },
  {
    name: "Reviewer Leaderboards",
    href: "/reviewers/leaderboards",
  },
  {
    name: "Reviewer Stats",
    href: "/reviewers",
    adminOnly: true,
  },
  {
    name: "Challenge Management",
    href: "/challenges",
    adminOnly: true,
  },
  {
    name: "RSVP Management",
    href: "/rsvps",
    adminOnly: true,
  },
  {
    name: "Check-Ins",
    href: "/check-ins",
    adminOnly: true,
  },
  {
    name: "Role Management",
    href: "/role-management",
    adminOnly: true,
  },

  {
    name: "Schedule",
    href: "/schedule",
    adminOnly: true,
  },
  {
    name: "Logs",
    href: "/logs",
    adminOnly: true,
  },
];
