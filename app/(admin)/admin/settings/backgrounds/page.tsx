import { Metadata } from "next"
import { BackgroundSettings } from "@/components/admin/BackgroundSettings"

export const metadata: Metadata = {
  title: "Cài đặt Ảnh Nền",
}

export default function BackgroundsSettingsPage() {
  return (
    <div className="p-6">
      <BackgroundSettings />
    </div>
  )
}
