import { Fragment, Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "./AuthContext";
import SuspenseLoader from "@/components/SuspenseLoader";
import { supabase } from "./supabaseClient";
import { toast } from "sonner";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

const AuthenticatedLayout = lazy(() => import("./_auth/AuthenticatedLayout"));
const AuthLayout = lazy(() => import("./_auth/AuthLayout"));
const SignInPage = lazy(() => import("./_auth/pages/SignInPage"));
const VerifyOtpPage = lazy(() => import("./_auth/pages/VerifyOtpPage"));
const CompleteProfilePage = lazy(
  () => import("./_auth/pages/CompleteProfilePage")
);
const OnboardingPage = lazy(() => import("./_auth/pages/OnboardingPage"));

const RootLayout = lazy(() => import("./_root/RootLayout"));
const HomePage = lazy(() => import("./_root/pages/HomePage"));
const ProfilePage = lazy(() => import("./_root/pages/ProfilePage"));
const SettingsPage = lazy(() => import("./_root/pages/SettingsPage"));
const FeedPage = lazy(() => import("./_root/pages/FeedPage"));
const NotFoundPage = lazy(() => import("./_root/pages/NotFoundPage"));

const ProjectLayout = lazy(() => import("./_project/ProjectLayout"));
const ProjectDashboardPage = lazy(
  () => import("./_project/pages/ProjectDashboardPage")
);
const ChatPage = lazy(() => import("./_project/pages/ChatPage"));
const TasksPage = lazy(() => import("./_project/pages/TasksPage"));
const MembersPage = lazy(() => import("./_project/pages/MembersPage"));
const ProjectSettingsPage = lazy(
  () => import("./_project/pages/ProjectSettingsPage")
);

const FeedbackBoard = lazy(() => import("./_root/pages/FeedbackBoard"));

function AppRoutes() {
  const { session, isLoading, userProfile, project } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const checkNewUserOnboarding = async () => {
      if (
        session &&
        userProfile &&
        !userProfile.onboarded &&
        location.pathname !== "/onboarding"
      ) {
        // If session exists, profile exists, but user is not onboarded, redirect to onboarding.
        navigate("/onboarding");
      } else if (
        session &&
        userProfile &&
        userProfile.onboarded &&
        location.pathname.startsWith("/auth")
      ) {
        // If session exists, profile exists, user is onboarded, and they are on auth route, redirect to home.
        navigate("/");
      }
    };
    if (!isLoading) {
      checkNewUserOnboarding();
    }
  }, [session, isLoading, userProfile, location.pathname, navigate]);

  // Handle email confirmation for new users and show confetti
  useEffect(() => {
    const handleAuthChange = async () => {
      const currentUser = await supabase.auth.getUser();
      if (currentUser?.data?.user && session) {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("onboarded")
          .eq("id", currentUser.data.user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          return;
        }

        // Check if it's a *newly confirmed* user who just completed onboarding to show confetti
        if (
          profiles?.onboarded &&
          session.user.created_at === session.user.last_sign_in_at &&
          location.pathname === "/"
        ) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 15000); // Confetti for 15 seconds
        }

        // Customer success nudge: Chat feature for new projects
        if(project && project.id && location.pathname.startsWith(`/project/${project.id}`)){ // Only check if inside a project
          const { count: chatMessageCount, error: chatError } = await supabase
            .from('project_chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', project.id);

          if (chatError) {
            console.error("Error fetching chat messages:", chatError);
            return;
          }

          // If a new user (first sign in) and no chat messages, show a nudge
          if (chatMessageCount === 0 && session.user.created_at === session.user.last_sign_in_at) {
            toast.info("💬 Heb je de chat al geprobeerd?", {
              description: "Er zijn pas 0 chatberichten in je project. Probeer de chatfunctie om sneller antwoorden te krijgen!",
              duration: 15000, // Show for 15 seconds
              action: {
                label: "Open Chat",
                onClick: () => navigate(`/project/${project.id}/chat`),
              },
              onDismiss: () => localStorage.setItem(`chat-nudge-shown-${project.id}`, 'true'),
              onAutoClose: () => localStorage.setItem(`chat-nudge-shown-${project.id}`, 'true'),
            });
          }
        }
      }
    };

    // Only run this effect if session is available and the userProfile is loaded
    if (session && userProfile) {
      handleAuthChange();
    }

  }, [session, userProfile, navigate, project, location.pathname]);

  if (isLoading) {
    return <SuspenseLoader />;
  }

  return (
    <Fragment>
      {showConfetti && <Confetti width={width} height={height} recycle={false} />} {2}
      <main className="flex h-full">
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            {/* Public and Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/auth/sign-in" element={<SignInPage />} />
              <Route path="/auth/verify-otp" element={<VerifyOtpPage />} />
              <Route
                path="/auth/complete-profile"
                element={<CompleteProfilePage />}
              />
            </Route>

            {/* Onboarding route (special case, requires session but no full layout) */}
            <Route element={<AuthenticatedLayout />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            {/* Private routes requiring authentication */}
            <Route element={<RootLayout />}>
              <Route index element={<HomePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/feedback" element={<FeedbackBoard />} />
            </Route>

            {/* Project-specific routes */}
            <Route path="/project/:projectId" element={<ProjectLayout />}>
              <Route index element={<ProjectDashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="tasks" element={<TasksPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="settings" element={<ProjectSettingsPage />} />
            </Route>

            {/* Catch-all for 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Toaster richColors />
    </Fragment>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
