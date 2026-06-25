"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CoverImageUpload } from "@/components/posts/CoverImageUpload"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function BackgroundSettings() {
  const router = useRouter()
  const [backgrounds, setBackgrounds] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/settings/backgrounds")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setBackgrounds(data.data)
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings/backgrounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgrounds }),
      })
      if (res.ok) {
        toast("Đã lưu cài đặt")
        router.refresh()
      } else {
        throw new Error("Failed to save")
      }
    } catch (e) {
      toast("Lỗi khi lưu cài đặt")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin w-8 h-8 text-accent" /></div>
  }

  const seasons = ["spring", "summer", "autumn", "winter"]
  const modes = ["light", "dark"]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cài đặt ảnh nền</h2>
          <p className="text-text-secondary mt-2">
            Thay đổi ảnh nền cho từng mùa và chế độ sáng/tối.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-accent text-white px-4 py-2 rounded-md font-medium hover:bg-accent/90 disabled:opacity-50"
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {seasons.map((season) => (
          modes.map((mode) => {
            const key = `${season}_${mode}`
            return (
              <div key={key} className="space-y-2 border border-border-default p-4 rounded-xl">
                <h3 className="font-semibold text-lg capitalize">{season} - {mode}</h3>
                <CoverImageUpload
                  value={backgrounds[key] || `/bg/${key}.jpg`}
                  onChange={(url) => setBackgrounds((prev) => ({ ...prev, [key]: url }))}
                />
              </div>
            )
          })
        ))}
      </div>
    </div>
  )
}
