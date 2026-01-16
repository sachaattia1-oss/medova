import { ReactNode } from "react";
import TutorSidebar from "./TutorSidebar";

interface TutorLayoutProps {
  children: ReactNode;
}

const TutorLayout = ({ children }: TutorLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TutorSidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default TutorLayout;
