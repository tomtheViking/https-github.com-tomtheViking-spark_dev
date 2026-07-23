import React, { useState, useEffect } from "react";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import { 
  Calendar as CalendarIcon, 
  Video, 
  Plus, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  Clock, 
  Users, 
  ShieldCheck 
} from "lucide-react";
import { auth } from "../lib/firebase";

interface GoogleEvent {
  id: string;
  summary: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  hangoutLink?: string;
  conferenceData?: {
    entryPoints?: Array<{
      entryPointType: string;
      uri: string;
    }>;
  };
  attendees?: Array<{
    email: string;
    responseStatus?: string;
  }>;
}

interface MeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
}

export function GoogleMeetWorkspace() {
  const [isRealMode, setIsRealMode] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [meetSpace, setMeetSpace] = useState<MeetSpace | null>(null);
  const [syncingEvents, setSyncingEvents] = useState<boolean>(false);
  const [creatingMeet, setCreatingMeet] = useState<boolean>(false);
  
  // Copy state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const getTomorrowAt1130 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(11, 30, 0, 0);
    return d.toISOString();
  };

  const getTomorrowAt1230 = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 30, 0, 0);
    return d.toISOString();
  };

  // Sandbox data for offline or demo testing
  const sandboxEvents: GoogleEvent[] = [
    {
      id: "sb_clay_malcolm",
      summary: "GMeet Sync: Clay Malcolm Discovery",
      description: "Dialogue science integration and onboarding planning.",
      start: { dateTime: getTomorrowAt1130() },
      end: { dateTime: getTomorrowAt1230() },
      hangoutLink: "https://meet.google.com/cmy-clay-mal",
      attendees: [
        { email: "tom.hansen2010@gmail.com", responseStatus: "accepted" },
        { email: "clay.malcolm@example.com", responseStatus: "accepted" }
      ]
    },
    {
      id: "sb_1",
      summary: "Spark Platform Demo: SnailCare Logistics",
      description: "Dialogue science capabilities review and pricing discussion.",
      start: { dateTime: new Date(Date.now() + 2 * 3600000).toISOString() },
      end: { dateTime: new Date(Date.now() + 3 * 3600000).toISOString() },
      hangoutLink: "https://meet.google.com/abc-defg-hij",
      attendees: [
        { email: "tom.hansen2010@gmail.com", responseStatus: "accepted" },
        { email: "liz.gallop@snailcare.com", responseStatus: "accepted" }
      ]
    },
    {
      id: "sb_2",
      summary: "Strategic Alignment Briefing: Equine Digital",
      description: "Aligning outbound sales pipelines with compliance structures.",
      start: { dateTime: new Date(Date.now() + 24 * 3600000).toISOString() },
      end: { dateTime: new Date(Date.now() + 25 * 3600000).toISOString() },
      hangoutLink: "https://meet.google.com/qwe-rtyu-iop",
      attendees: [
        { email: "tom.hansen2010@gmail.com", responseStatus: "accepted" },
        { email: "phil.muffins@equinedigital.com", responseStatus: "needsAction" }
      ]
    },
    {
      id: "sb_3",
      summary: "Muffin & Sons Outbound Audit",
      description: "Reviewing transcript discrepancies and Milton model integration.",
      start: { dateTime: new Date(Date.now() + 48 * 3600000).toISOString() },
      end: { dateTime: new Date(Date.now() + 49 * 3600000).toISOString() },
      hangoutLink: "https://meet.google.com/zxc-vbnm-asd",
      attendees: [
        { email: "tom.hansen2010@gmail.com", responseStatus: "accepted" },
        { email: "mark.mercer@spark.io", responseStatus: "accepted" }
      ]
    }
  ];

  useEffect(() => {
    // Monitor firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAccessToken(null);
        setIsLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(type);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // Google Sign-in for Real Integration
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      // Add requested scopes confirmed in UI
      provider.addScope("https://www.googleapis.com/auth/calendar.readonly");
      provider.addScope("https://www.googleapis.com/auth/calendar.events.readonly");
      provider.addScope("https://www.googleapis.com/auth/meetings.space.readonly");
      provider.addScope("https://www.googleapis.com/auth/meetings.space.created");
      provider.addScope("https://www.googleapis.com/auth/meetings.space.settings");

      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      
      if (!credential || !credential.accessToken) {
        throw new Error("Could not acquire Google OAuth access token from Firebase Authentication.");
      }

      setAccessToken(credential.accessToken);
      setIsLoggedIn(true);
      setIsRealMode(true);
      
      // Auto-fetch events on success
      await fetchRealCalendarEvents(credential.accessToken);
    } catch (err: any) {
      console.error("[Google OAuth Error]:", err);
      if (
        err.code === "auth/popup-closed-by-user" || 
        err.code === "auth/cancelled-popup-request" ||
        (err.message && err.message.includes("popup-closed-by-user"))
      ) {
        setError("The connection process was cancelled because the sign-in window was closed before completion. Please click 'Connect Google Account' again and complete the Google login to link your account.");
      } else {
        setError(err.message || "Failed to authenticate with your Google Workspace Account.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch Calendar Events (Real Mode)
  const fetchRealCalendarEvents = async (token: string) => {
    setSyncingEvents(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now)}&maxResults=10&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to fetch calendar events from Google API.");
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (err: any) {
      console.error("[Calendar Fetch Error]:", err);
      setError(err.message || "Could not retrieve calendar items. Please check token permissions.");
    } finally {
      setSyncingEvents(false);
    }
  };

  // Create Google Meet Space (Real Mode)
  const handleCreateRealMeetSpace = async () => {
    if (!accessToken) {
      setError("Active access token is missing. Please sign in again.");
      return;
    }
    setCreatingMeet(true);
    setError(null);
    try {
      // POST request to meet.googleapis.com/v2/spaces
      const response = await fetch("https://meet.googleapis.com/v2/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Failed to create Google Meet space.");
      }

      const data = await response.json();
      setMeetSpace({
        name: data.name, // e.g. "spaces/abc-defg-hij"
        meetingUri: data.meetingUri || `https://meet.google.com/${data.meetingCode}`,
        meetingCode: data.meetingCode
      });
    } catch (err: any) {
      console.error("[Meet Space Error]:", err);
      setError(err.message || "Failed to create a new Google Meet session space.");
    } finally {
      setCreatingMeet(false);
    }
  };

  // Switch to Sandbox Mode
  const enableSandboxMode = () => {
    setIsRealMode(false);
    setEvents(sandboxEvents);
    setError(null);
  };

  // Force Refresh/Sync
  const triggerSync = async () => {
    if (isRealMode && accessToken) {
      await fetchRealCalendarEvents(accessToken);
    } else {
      setSyncingEvents(true);
      await new Promise(resolve => setTimeout(resolve, 600));
      setEvents(sandboxEvents);
      setSyncingEvents(false);
    }
  };

  // Handle manual mock space generation for sandbox
  const triggerSandboxMeetSpace = async () => {
    setCreatingMeet(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const segment1 = Array.from({length: 3}, () => alphabet[Math.floor(Math.random() * 26)]).join("");
    const segment2 = Array.from({length: 4}, () => alphabet[Math.floor(Math.random() * 26)]).join("");
    const segment3 = Array.from({length: 3}, () => alphabet[Math.floor(Math.random() * 26)]).join("");
    const code = `${segment1}-${segment2}-${segment3}`;
    
    setMeetSpace({
      name: `spaces/${code}`,
      meetingUri: `https://meet.google.com/${code}`,
      meetingCode: code
    });
    setCreatingMeet(false);
  };

  // Initialize sandbox events on component mount if in sandbox
  useEffect(() => {
    if (!isRealMode) {
      setEvents(sandboxEvents);
    }
  }, [isRealMode]);

  return (
    <div className="mt-4 bg-slate-50 border border-slate-200 rounded-3xl p-6 space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h4 className="font-display font-bold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            Google Workspace Testing Center
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xl">
            You can test Spark's real OAuth integration with your Google Workspace account or use the pre-configured mock sandbox environment to simulate meeting imports.
          </p>
        </div>

        {/* Integration Mode Switcher */}
        <div className="flex items-center bg-slate-200/70 p-1 rounded-xl shrink-0">
          <button
            onClick={enableSandboxMode}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              !isRealMode 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sandbox Mode
          </button>
          <button
            onClick={() => {
              if (isLoggedIn && accessToken) {
                setIsRealMode(true);
                fetchRealCalendarEvents(accessToken);
              } else {
                handleGoogleSignIn();
              }
            }}
            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
              isRealMode 
                ? "bg-rose-600 text-white shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Lock className="w-3 h-3 shrink-0" />
            Real Google API
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 text-[11px] font-semibold rounded-2xl p-4 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="block font-bold">Integration Connection Interrupted</span>
            <p className="font-normal text-slate-600 leading-relaxed">{error}</p>
            {error.includes("OAuth") && (
              <p className="font-normal text-slate-400 mt-1">
                Tip: Verify that your redirect URIs match your secure Spark staging origin in your Google Developer console.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Connection status when logged in to real account */}
      {isRealMode && isLoggedIn && user && (
        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ""} className="w-9 h-9 rounded-full border-2 border-emerald-400 shadow-xs" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
              </div>
            )}
            <div>
              <span className="block text-xs font-bold text-slate-800">Connected as {user.displayName || "Google Workspace User"}</span>
              <span className="block text-[10px] text-slate-500 font-mono">{user.email}</span>
            </div>
          </div>
          <button
            onClick={() => {
              auth.signOut();
              setAccessToken(null);
              setIsLoggedIn(false);
              setIsRealMode(false);
            }}
            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Main Grid: Meet space creator and Calendar feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Create Meet Space */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-slate-900">Instant Meet Launcher</h5>
              <p className="text-[10px] text-slate-500">Create & distribute real-time conference corridors</p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
            <p className="text-[10.5px] text-slate-600 leading-relaxed">
              Provision an active Google Meet conference space code directly. Once generated, share the link with participants or add it to calendar events.
            </p>

            <button
              onClick={isRealMode ? handleCreateRealMeetSpace : triggerSandboxMeetSpace}
              disabled={creatingMeet || (isRealMode && !accessToken)}
              className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isRealMode && !accessToken
                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              }`}
            >
              {creatingMeet ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Provisioning Space...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Generate Meet Corridor</span>
                </>
              )}
            </button>
          </div>

          {meetSpace && (
            <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-xl p-4 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2 py-0.5 rounded-full">
                  Meet Room Active
                </span>
                <span className="text-[9.5px] text-slate-500 font-mono">
                  Code: {meetSpace.meetingCode}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-600 truncate mr-2 max-w-[150px] sm:max-w-[180px]">
                  {meetSpace.meetingUri}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopy(meetSpace.meetingUri, "room")}
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                    title="Copy meeting link"
                  >
                    {copiedLink === "room" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={meetSpace.meetingUri}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800 transition-all"
                    title="Join meeting room"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Calendar Events Feed */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">Google Calendar Stream</h5>
                <p className="text-[10px] text-slate-500">
                  {isRealMode ? "Live feed of your Google Workspace primary calendar" : "Simulated sales pipeline calendar events"}
                </p>
              </div>
            </div>

            <button
              onClick={triggerSync}
              disabled={syncingEvents}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              title="Refresh Event Stream"
            >
              <RefreshCw className={`w-4 h-4 ${syncingEvents ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Event list */}
          <div className="flex-1 space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
            {syncingEvents ? (
              <div className="h-40 flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
                <span className="text-[10.5px] font-medium text-slate-500">Syncing workspace stream...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center space-y-1.5 text-center">
                <CalendarIcon className="w-8 h-8 text-slate-300" />
                <span className="text-[11px] font-bold text-slate-800">No Upcoming Events Found</span>
                <p className="text-[10px] text-slate-500 max-w-xs px-4">
                  Add events with Google Meet conferencing links to your primary Google Calendar and refresh.
                </p>
              </div>
            ) : (
              events.map((event) => {
                const isMeetingConfirmed = !!event.hangoutLink;
                const startDate = event.start?.dateTime ? new Date(event.start.dateTime) : null;
                const dateString = startDate 
                  ? startDate.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                  : "All Day Event";

                return (
                  <div 
                    key={event.id}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-[11px] block truncate">
                          {event.summary}
                        </span>
                        {isMeetingConfirmed && (
                          <span className="inline-flex items-center gap-0.5 text-[8.5px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-100">
                            <Video className="w-2.5 h-2.5" />
                            Meet
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="text-[10px] text-slate-500 truncate max-w-sm">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9.5px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {dateString}
                        </span>
                        {event.attendees && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" />
                            {event.attendees.length} participants
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end gap-2 shrink-0">
                      {event.hangoutLink ? (
                        <a
                          href={event.hangoutLink}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full sm:w-auto py-1 px-3 rounded-lg text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all text-center flex items-center justify-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Launch Meet</span>
                        </a>
                      ) : (
                        <span className="text-[9.5px] text-slate-400 font-medium">No active link</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
