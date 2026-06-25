import { Metadata } from "next"
import { BackgroundSettings } from "@/components/admin/BackgroundSettings"

export const metadata: Metadata = {
  title: "Cài đặt ảnh nền",
}

export default function BackgroundsSettingsPage() {
  return (
    <div className="p-6">
      <BackgroundSettings />
    </div>
  )
}
