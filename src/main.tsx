import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorPage from "./error-page";
import "./index.css";

// Import specific pages
import HomePage from "./pages/HomePage";
import CreateProject from "./pages/CreateProject";
import ProjectView from "./pages/ProjectView";
import SettingsPage from "./pages/SettingsPage";
import ArtistProfile from "./pages/ArtistProfile";
import ReleaseTracker from "./pages/ReleaseTracker";
import RecordDealMaker from "./pages/RecordDealMaker";
import AINotes from "./pages/AINotes";
import ReleaseWizard from "./pages/ReleaseWizard";
import ImageGeneration from "./pages/ImageGeneration";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
			{
				path: "/",
				element: <HomePage />,
			},
			{
				path: "/create-project",
				element: <CreateProject />,
			},
			{
				path: "/project/:projectId",
				element: <ProjectView />,
			},
			{
				path: "/settings",
				element: <SettingsPage />,
			},
			{
				path: "/artist-profile",
				element: <ArtistProfile />,
			},
			{
				path: "/release-tracker",
				element: <ReleaseTracker />,
			},
			{
				path: "/record-deal-maker",
				element: <RecordDealMaker />,
			},
			{
				path: "/ai-notes",
				element: <AINotes />,
			},
			{
				path: "/release-wizard",
				element: <ReleaseWizard />,
			},
			{
				path: "/image-generation",
				element: <ImageGeneration />,
			},
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
