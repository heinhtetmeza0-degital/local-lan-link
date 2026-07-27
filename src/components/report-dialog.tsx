import { useState } from "react";
import { X } from "lucide-react";
import { reportPost, type ReportReason } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";

const reasons: ReportReason[] = ["spam", "harassment", "inappropriate", "misinformation", "other"];

export function ReportDialog({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { t } = useT();
  const [reason, setReason] = useState<ReportReason>("spam");
  const [detail, setDetail] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      reportPost(postId, reason, detail);
      toast.success(t("reportSubmitted"));
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md rounded-2xl bg-card shadow-pop p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{t("reportPost")}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{t("reportReasonPrompt")}</p>
        <div className="space-y-2">
          {reasons.map((r) => (
            <label
              key={r}
              className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-accent"
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              <span className="text-sm font-medium">{t(("reason_" + r) as never)}</span>
            </label>
          ))}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          placeholder={t("reportDetailPh")}
          className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm"
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>{t("cancel")}</Button>
          <Button type="submit">{t("submit")}</Button>
        </div>
      </form>
    </div>
  );
}
