import Container from "@/components/Container";
import AdminUsersTable from "@/components/AdminUsersTable";
import { getAdminsAndOrganizers, getUsersByRoles } from "@/data/user";
import PageBanner from "@/components/PageBanner";
import { getCurrentUser } from "@/auth";
import { redirect } from "next/navigation";

const RoleManagementPage = async () => {
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    redirect("https://app.hackcanada.org/login");
  }

  const [organizers, specialRoles] = await Promise.all([
    getAdminsAndOrganizers(),
    getUsersByRoles(["mentor", "volunteer", "judge"]),
  ]);

  const orgUsers = organizers.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
  }));

  const specialUsers = specialRoles.map((user) => ({
    name: user.name,
    email: user.email,
    role: user.role,
  }));

  return (
    <Container className="space-y-8">
      <PageBanner
        heading="Role Management"
        className="mb-4 md:mb-8"
        subheading="Get an overview of all users with special roles. Manage admins, organizers, mentors, volunteers, and judges."
      />

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">
          Admins & Organizers ({orgUsers.length})
        </h2>
        <AdminUsersTable users={orgUsers} />
      </section>

      {specialUsers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Mentors, Volunteers & Judges ({specialUsers.length})
          </h2>
          <AdminUsersTable users={specialUsers} />
        </section>
      )}

      {specialUsers.length === 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">
            Mentors, Volunteers & Judges
          </h2>
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            No users with mentor, volunteer, or judge roles found.
          </div>
        </section>
      )}
    </Container>
  );
};

export default RoleManagementPage;
