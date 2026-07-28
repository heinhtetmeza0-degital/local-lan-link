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

  // Settings
  settings: { en: "Settings", mm: "ဆက်တင်" },
  security: { en: "Security", mm: "လုံခြုံရေး" },
  goldMark: { en: "Gold Mark", mm: "ရွှေအမှတ်" },
  changePassword: { en: "Change password", mm: "စကားဝှက်ပြောင်းရန်" },
  currentPassword: { en: "Current password", mm: "လက်ရှိစကားဝှက်" },
  newPassword: { en: "New password", mm: "စကားဝှက်အသစ်" },
  confirmPassword: { en: "Confirm new password", mm: "စကားဝှက်အသစ်ကို အတည်ပြု" },
  passwordMismatch: { en: "New passwords do not match.", mm: "စကားဝှက်အသစ်များ မတိုက်ဆိုင်ပါ။" },
  passwordUpdated: { en: "Password updated", mm: "စကားဝှက်ကို ပြင်ဆင်ပြီးပါပြီ" },
  applyGoldMark: { en: "Apply for Gold Mark", mm: "ရွှေအမှတ်လျှောက်ရန်" },
  goldMarkDesc: {
    en: "Submit a request for the Gold Verification Mark. Include a reason and (optionally) a proof image.",
    mm: "ရွှေအတည်ပြုအမှတ်အတွက် တောင်းဆိုချက်တင်ပါ။ အကြောင်းနှင့် (ရွေးချယ်) သက်သေဓာတ်ပုံ ပါဝင်ပါ။",
  },
  reason: { en: "Reason", mm: "အကြောင်းပြချက်" },
  reasonPh: { en: "Why should you be verified?", mm: "ဘာလို့အတည်ပြုသင့်တာလဲ" },
  proofOptional: { en: "Proof (optional)", mm: "သက်သေ (ရွေးချယ်)" },
  submit: { en: "Submit", mm: "တင်သွင်း" },
  goldRequestSubmitted: { en: "Request submitted for review.", mm: "တောင်းဆိုချက်ကို စစ်ဆေးရန်တင်ပြီးပါပြီ။" },
  goldStatus: { en: "Your request status", mm: "သင့်တောင်းဆိုချက်အခြေအနေ" },
  statusPending: { en: "Pending review", mm: "စစ်ဆေးဆဲ" },
  statusApproved: { en: "Approved", mm: "အတည်ပြုပြီး" },
  statusRejected: { en: "Rejected", mm: "ငြင်းပယ်" },
  alreadyVerified: { en: "You are already verified. Thank you!", mm: "သင် အတည်ပြုပြီးသားဖြစ်ပါသည်။ ကျေးဇူးတင်ပါသည်။" },

  // Report
  reportPost: { en: "Report post", mm: "ပို့စ်ကို တိုင်ကြားမည်" },
  reportReasonPrompt: { en: "Choose a reason for reporting this post.", mm: "တိုင်ကြားရသည့် အကြောင်းရင်းရွေးပါ။" },
  reportDetailPh: { en: "Optional details…", mm: "အသေးစိတ် (ရွေးချယ်)…" },
  reportSubmitted: { en: "Report submitted. Thank you.", mm: "တိုင်ကြားချက်တင်ပြီးပါပြီ။ ကျေးဇူးတင်ပါသည်။" },
  reason_spam: { en: "Spam", mm: "စပမ်း" },
  reason_harassment: { en: "Harassment or bullying", mm: "နှောင့်ယှက်ခြင်း" },
  reason_inappropriate: { en: "Inappropriate content", mm: "မသင့်လျော်သောအကြောင်းအရာ" },
  reason_misinformation: { en: "False information", mm: "မမှန်ကန်သောသတင်း" },
  reason_other: { en: "Other", mm: "အခြား" },

  // Admin
  admin: { en: "Admin", mm: "အက်ဒမင်" },
  adminDashboard: { en: "Admin Dashboard", mm: "အက်ဒမင်ဒက်ရှ်ဘုတ်" },
  moderation: { en: "Moderation", mm: "စစ်ဆေးမှု" },
  goldApprovals: { en: "Gold approvals", mm: "ရွှေအမှတ်များ" },
  adsManager: { en: "Ads Manager", mm: "ကြော်ငြာမန်နေဂျာ" },
  reportedPosts: { en: "Reported posts", mm: "တိုင်ကြားထားသည့်ပို့စ်များ" },
  noReports: { en: "No reports.", mm: "တိုင်ကြားချက်မရှိပါ။" },
  noRequests: { en: "No requests.", mm: "တောင်းဆိုချက်မရှိပါ။" },
  noAds: { en: "No ads yet.", mm: "ကြော်ငြာမရှိသေးပါ။" },
  reportedBy: { en: "Reported by", mm: "တိုင်ကြားသူ" },
  deletePost: { en: "Delete post", mm: "ပို့စ်ကို ဖျက်မည်" },
  dismiss: { en: "Dismiss", mm: "ပယ်ဖျက်" },
  resolve: { en: "Resolve", mm: "ပြီးမြောက်" },
  approve: { en: "Approve", mm: "အတည်ပြု" },
  reject: { en: "Reject", mm: "ငြင်းပယ်" },
  newAd: { en: "New ad", mm: "ကြော်ငြာအသစ်" },
  adTitle: { en: "Ad title", mm: "ကြော်ငြာခေါင်းစဉ်" },
  adLink: { en: "Link (optional)", mm: "လင့်ခ် (ရွေးချယ်)" },
  adImage: { en: "Image", mm: "ပုံ" },
  addAd: { en: "Publish ad", mm: "ကြော်ငြာတင်" },
  sponsored: { en: "Sponsored", mm: "ကြော်ငြာ" },
  credit: { en: "Created by Hein Htet Soe", mm: "ဖန်တီးသူ - ဟိန်းထက်စိုး" },

  // Save
  savePost: { en: "Save post", mm: "ပို့စ်အား သိမ်းဆည်းမည်" },
  unsavePost: { en: "Unsave post", mm: "သိမ်းဆည်းမှုဖျက်" },
  postSaved: { en: "Post saved", mm: "ပို့စ်ကို သိမ်းပြီးပါပြီ" },
  postUnsaved: { en: "Post unsaved", mm: "သိမ်းဆည်းမှုကို ဖျက်ပြီးပါပြီ" },
  saved: { en: "Saved", mm: "သိမ်းထားသည်" },
  savedPosts: { en: "Saved posts", mm: "သိမ်းထားသောပို့စ်များ" },
  noSavedPosts: { en: "No saved posts yet.", mm: "သိမ်းထားသောပို့စ်မရှိသေးပါ။" },

  // KYC
  kyc: { en: "KYC verification", mm: "ကိုယ်ရေးအထောက်အထား" },
  dob: { en: "Date of birth", mm: "မွေးသက္ကရာဇ်" },
  idDocument: { en: "National ID (NRC) or Driver's License", mm: "မှတ်ပုံတင် သို့ ယာဉ်မောင်းလိုင်စင်" },
  idUploadHint: { en: "Upload a clear photo of your ID (front side).", mm: "မှတ်ပုံတင်၏ ရှေ့ဖက်ကို ရှင်းလင်းစွာ ရိုက်တင်ပါ။" },
  selfieVideo: { en: "Selfie verification video", mm: "ကိုယ်တိုင်အတည်ပြု ဗီဒီယို" },
  selfieVideoHint: {
    en: "Record a short selfie video showing your face straight, then turning slightly left and right.",
    mm: "မျက်နှာ တည့်တည့်၊ ဘယ်ဘက် တစ်ချက်၊ ညာဘက် တစ်ချက် လှည့်ပြသည့် အသံဖမ်းဗီဒီယို တင်ပါ။",
  },
  uploadVideo: { en: "Upload video", mm: "ဗီဒီယိုတင်" },
  kycNote: {
    en: "Your KYC documents are sent to the admin for review and are stored securely on this device.",
    mm: "KYC စာရွက်စာတမ်းများကို အက်ဒမင်ထံ စစ်ဆေးရန်ပို့ပြီး ဤစက်တွင် လုံခြုံစွာ သိမ်းဆည်းပါသည်။",
  },

  // Biometric
  biometric: { en: "Biometric unlock", mm: "လက်ဗွေ / မျက်နှာ လုံခြုံရေး" },
  biometricDesc: {
    en: "Enable Fingerprint or Face Unlock as an extra layer of app lock protection.",
    mm: "လက်ဗွေ သို့ မျက်နှာဖြင့် အက်ပ်လော့ခ်ဖွင့်ရန် ဖွင့်ထားပါ။",
  },
  biometricEnabled: { en: "Biometric unlock enabled", mm: "လက်ဗွေအတည်ပြု ဖွင့်ထားပြီး" },
  biometricDisabled: { en: "Biometric unlock disabled", mm: "လက်ဗွေအတည်ပြု ပိတ်ထားသည်" },
  biometricUnsupported: {
    en: "This device does not support platform biometrics.",
    mm: "ဤစက်တွင် biometric စနစ်မရှိပါ။",
  },
  enable: { en: "Enable", mm: "ဖွင့်" },
  disable: { en: "Disable", mm: "ပိတ်" },
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
