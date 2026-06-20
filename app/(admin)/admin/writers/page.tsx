import { Plus, Search } from "lucide-react"

import { AdminPageHeader } from "@/components/admin/AdminPrimitives"
import { InviteWriterForm } from "@/components/admin/InviteWriterForm"
import { PendingInvitesTable } from "@/components/admin/PendingInvitesTable"
import { WritersTable } from "@/components/admin/WritersTable"
import { getCachedAdminWritersData } from "@/lib/queries"
import { ScrollReveal } from "@/components/ui/ScrollReveal"

export default async function AdminWritersPage() {
  const { pendingInvites, writers } = await getCachedAdminWritersData()

  return (
    <div className="animate-in fade-in duration-300">
      <AdminPageHeader
        action={
          <a href="#invite-form" className="flex lg:hidden h-[34px] w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-accent px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90">
            <Plus aria-hidden="true" className="h-3.5 w-3.5" />
            Invite Writer
          </a>
        }
        subtitle="Manage your editorial team and permissions"
        title="Writers"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Left Column */}
        <div className="min-w-0 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-[280px]">
              <Search
                aria-hidden="true"
                className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary"
              />
              <input
                className="h-[34px] w-full rounded-full border border-border-default bg-transparent pl-8 pr-2.5 text-[13px] outline-none transition-colors placeholder:text-text-tertiary focus:border-accent"
                placeholder="Search writers by name or email..."
                type="text"
              />
            </div>
          </div>

          <ScrollReveal index={0} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6">
            <WritersTable writers={writers} />
          </ScrollReveal>
        </div>

        <div className="flex flex-col gap-6">
          <ScrollReveal index={1} id="invite-form" className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6 scroll-mt-24">
            <h2 className="text-[15px] font-semibold text-text-primary">
              Invite a writer
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Send an invite link to create a writer account.
            </p>
            <div className="mt-4">
              <InviteWriterForm />
            </div>
          </ScrollReveal>

          <ScrollReveal index={2} className="rounded-[24px] border-[2px] border-border-default bg-subtle-bg/30 p-6">
            <div className="mb-2">
              <h2 className="text-[15px] font-semibold text-text-primary">
                Pending invites
              </h2>
              <p className="mt-1 text-[13px] text-text-secondary">
                Open invites that have not expired.
              </p>
            </div>
            <PendingInvitesTable invites={pendingInvites} />
          </ScrollReveal>
        </div>
      </div>
    </div>
  )
}
