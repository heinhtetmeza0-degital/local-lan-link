import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "mm";

type Dict = Record<string, { en: string; mm: string }>;

const dict: Dict = {
  // Brand / tagline
  brand: { en: "Shwe Meza", mm: "ရွှေမဲဇာ" },
  tagline: {
    en: "A social space for your local network.",
    mm: "သင့်ကွန်ရက်အတွက် ဆိုရှယ်နေရာလေး။",
  },

  // Auth
  signIn: { en: "Sign in", mm: "အကောင့်ဝင်ရန်" },
  signUp: { en: "Sign up", mm: "အကောင့်ဖွင့်ရန်" },
  signOut: { en: "Sign out", mm: "ထွက်ရန်" },
  welcomeBack: { en: "Welcome back", mm: "ပြန်လည်ကြိုဆိုပါသည်" },
  accountCreated: { en: "Account created", mm: "အကောင့်ဖန်တီးပြီးပါပြီ" },
  username: { en: "Username", mm: "အသုံးပြုသူအမည်" },
  password: { en: "Password", mm: "စကားဝှက်" },
  displayName: { en: "Display name", mm: "ပြသအမည်" },
  bio: { en: "Bio", mm: "အကြောင်း" },
  addPhoto: { en: "Tap to add a profile photo", mm: "ပရိုဖိုင်ဓာတ်ပုံထည့်ရန်နှိပ်ပါ" },
  createAccount: { en: "Create account", mm: "အကောင့်ဖန်တီးရန်" },
  usernamePh: { en: "e.g. alex", mm: "ဥပမာ - alex" },
  passwordPh: { en: "At least 4 characters", mm: "အနည်းဆုံး ၄ လုံး" },
  displayNamePh: { en: "Alex Rivera", mm: "ဥပမာ - မောင်မောင်" },
  bioPh: { en: "A short intro (optional)", mm: "အတိုချုပ်မိတ်ဆက် (ရွေးချယ်)" },
  demoAccounts: { en: "Demo accounts", mm: "စမ်းသုံးအကောင့်များ" },
  failed: { en: "Failed", mm: "မအောင်မြင်ပါ" },

  // Nav
  home: { en: "Home", mm: "ပင်မ" },
  search: { en: "Search", mm: "ရှာဖွေ" },
  alerts: { en: "Alerts", mm: "အသိပေး" },
  messages: { en: "Chats", mm: "စကားပြော" },
  profile: { en: "Profile", mm: "ပရိုဖိုင်" },

  // Feed
  whatsOnMind: { en: "What's on your mind", mm: "ဘာစဉ်းစားနေလဲ" },
  photo: { en: "Photo", mm: "ဓာတ်ပုံ" },
  video: { en: "Video", mm: "ဗီဒီယို" },
  voice: { en: "Voice", mm: "အသံ" },
  post: { en: "Post", mm: "တင်ရန်" },
  posted: { en: "Posted", mm: "တင်ပြီးပါပြီ" },
  noPostsFeed: {
    en: "No posts yet — be the first to share something.",
    mm: "ပို့စ်မရှိသေးပါ — ပထမဆုံးမျှဝေလိုက်ပါ။",
  },
  like: { en: "Like", mm: "နှစ်သက်" },
  comment: { en: "Comment", mm: "မှတ်ချက်" },
  share: { en: "Share", mm: "မျှဝေ" },
  linkCopied: { en: "Link copied", mm: "လင့်ခ်ကူးပြီးပါပြီ" },
  writeComment: { en: "Write a comment…", mm: "မှတ်ချက်ရေးရန်…" },
  recording: { en: "Recording…", mm: "အသံဖမ်းနေသည်…" },
  startRecord: { en: "Start recording", mm: "အသံဖမ်းရန်" },
  stopRecord: { en: "Stop", mm: "ရပ်" },
  micDenied: { en: "Microphone permission denied", mm: "မိုက်ခွင့်မပြုပါ" },

  // Notifications
  notifications: { en: "Notifications", mm: "အသိပေးချက်များ" },
  noNotifs: { en: "No notifications yet.", mm: "အသိပေးချက်မရှိသေးပါ။" },
  likedYourPost: { en: "liked your post", mm: "သင့်ပို့စ်ကို နှစ်သက်သည်" },
  commentedYourPost: { en: "commented on your post", mm: "သင့်ပို့စ်ကို မှတ်ချက်ပေးသည်" },

  // Search
  searchPeople: { en: "Search people…", mm: "လူများရှာရန်…" },
  peopleOnNetwork: { en: "People on the network", mm: "ကွန်ရက်ရှိသူများ" },
  results: { en: "Results", mm: "ရလဒ်များ" },
  noneFound: { en: "No one found.", mm: "မတွေ့ပါ။" },

  // Profile
  posts: { en: "Posts", mm: "ပို့စ်များ" },
  photos: { en: "Photos", mm: "ဓာတ်ပုံများ" },
  noPostsYet: { en: "No posts yet.", mm: "ပို့စ်မရှိသေးပါ။" },
  noPhotosYet: { en: "No photos yet.", mm: "ဓာတ်ပုံမရှိသေးပါ။" },
  edit: { en: "Edit", mm: "ပြင်ရန်" },
  save: { en: "Save", mm: "သိမ်း" },
  cancel: { en: "Cancel", mm: "ပယ်ဖျက်" },
  message: { en: "Message", mm: "မက်ဆေ့ချ်" },
  call: { en: "Call", mm: "ခေါ်ဆို" },
  videoCall: { en: "Video", mm: "ဗီဒီယို" },

  // Chats
  chats: { en: "Chats", mm: "စကားပြောများ" },
  newGroup: { en: "New group", mm: "အုပ်စုအသစ်" },
  groupName: { en: "Group name", mm: "အုပ်စုအမည်" },
  create: { en: "Create", mm: "ဖန်တီး" },
  selectMembers: { en: "Select members", mm: "အဖွဲ့ဝင်များရွေးပါ" },
  noChats: { en: "No chats yet. Start one from a profile.", mm: "စကားပြောမရှိသေးပါ။ ပရိုဖိုင်မှစတင်ပါ။" },
  typeMessage: { en: "Type a message…", mm: "မက်ဆေ့ချ်ရိုက်ပါ…" },
  online: { en: "Online", mm: "အွန်လိုင်း" },
  members: { en: "members", mm: "ဦး" },
  file: { en: "File", mm: "ဖိုင်" },
  sentAFile: { en: "sent a file", mm: "ဖိုင်ပို့သည်" },
  sentAnImage: { en: "sent an image", mm: "ဓာတ်ပုံပို့သည်" },
  sentAVideo: { en: "sent a video", mm: "ဗီဒီယိုပို့သည်" },
  sentAVoice: { en: "sent a voice note", mm: "အသံမက်ဆေ့ချ်ပို့သည်" },

  // Calls
  incomingCall: { en: "Calling…", mm: "ခေါ်ဆိုနေသည်…" },
  callConnected: { en: "Connected", mm: "ချိတ်ဆက်ပြီး" },
  endCall: { en: "End", mm: "ချ" },
  mute: { en: "Mute", mm: "အသံပိတ်" },
  unmute: { en: "Unmute", mm: "အသံဖွင့်" },
  camera: { en: "Camera", mm: "ကင်မရာ" },
  cameraOff: { en: "Camera off", mm: "ကင်မရာပိတ်" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };

const I18nCtx = createContext<Ctx | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("shwe_lang")) as Lang | null;
    if (saved === "en" || saved === "mm") setLangState(saved);
  }, []);
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang === "mm" ? "my" : "en";
      document.documentElement.dataset.lang = lang;
    }
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("shwe_lang", l);
  };
  const t = (k: keyof typeof dict) => dict[k]?.[lang] ?? String(k);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useT() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT();
  return (
    <div
      className={
        "inline-flex items-center bg-muted rounded-full p-0.5 text-xs font-semibold " + className
      }
    >
      <button
        onClick={() => setLang("en")}
        className={
          "px-2.5 py-1 rounded-full transition-colors " +
          (lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
        }
      >
        EN
      </button>
      <button
        onClick={() => setLang("mm")}
        className={
          "px-2.5 py-1 rounded-full transition-colors " +
          (lang === "mm" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
        }
      >
        MM
      </button>
    </div>
  );
}
