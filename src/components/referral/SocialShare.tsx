import { MessageCircle, Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { buildShareUrls } from "../../lib/referral/constants";

interface SocialShareProps {
  link: string;
  message?: string;
}

export function SocialShare({ link, message = "Join me on AIRank — discover the best AI tools!" }: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const urls = buildShareUrls(link, message);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const openShare = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const buttons = [
    { label: "WhatsApp", icon: MessageCircle, url: urls.whatsapp, color: "hover:bg-emerald-500/15 hover:text-emerald-500 hover:border-emerald-500/30" },
    { label: "Twitter", icon: Twitter, url: urls.twitter, color: "hover:bg-sky-500/15 hover:text-sky-400 hover:border-sky-500/30" },
    { label: "LinkedIn", icon: Linkedin, url: urls.linkedin, color: "hover:bg-blue-500/15 hover:text-blue-400 hover:border-blue-500/30" },
    { label: "Facebook", icon: Facebook, url: urls.facebook, color: "hover:bg-indigo-500/15 hover:text-indigo-400 hover:border-indigo-500/30" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {buttons.map(({ label, icon: Icon, url, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => openShare(url)}
            className={`flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-3 py-2.5 text-xs font-medium text-muted-foreground transition-all cursor-pointer ${color}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground cursor-pointer"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Link2 className="h-4 w-4" />}
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}
