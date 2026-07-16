import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"
import { getCachedAdminWritersData } from "@/lib/queries"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminWritersPage() {
  const { pendingInvites, writers } = await getCachedAdminWritersData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        subtitle="Manage your editorial team and permissions"
        title="Writers"
      />

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <ScrollReveal index={0}>
            <WritersTable writers={writers} />
          </ScrollReveal>
        </div>

        {pendingInvites.length > 0 && (
          <div className="flex flex-col gap-4">
            <ScrollReveal index={1}>
              <div className="mb-4">
                <h2 className="text-[18px] font-bold text-text-primary">
                  Pending Invites
                </h2>
                <p className="mt-1 text-[14px] text-text-secondary">
                  Open invites that have not expired.
                </p>
              </div>
              <PendingInvitesTable invites={pendingInvites} />
            </ScrollReveal>
          </div>
        )}
      </div>
    </div>
  )
}
