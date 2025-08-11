import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AppProvider } from "./lib/context";
import Dashboard from "./pages/Dashboard";
import Words from "./pages/Words";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import StudyActivities from "./pages/StudyActivities";
import StudySessions from "./pages/StudySessions";
import Statistics from "./pages/Statistics";
import NotFound from "./pages/NotFound";
import Import from "./pages/Import";
import YouTubeListening from "./pages/YouTubeListening";

const App = () => (
  <AppProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="/words" element={<Words />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route path="/study" element={<StudyActivities />} />
          <Route path="/sessions" element={<StudySessions />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/import" element={<Import />} />
          <Route path="/youtube-listening" element={<YouTubeListening />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </AppProvider>
);

export default App;
