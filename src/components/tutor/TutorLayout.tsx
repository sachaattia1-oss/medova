import { ReactNode } from "react";
import TutorSidebar from "./TutorSidebar";

interface TutorLayoutProps {
  children: ReactNode;
}

const TutorLayout = ({ children }: TutorLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <TutorSidebar />
      <main className="lg:ml-64 pt-20 lg:pt-8 px-4 sm:px-6 lg:p-8">
        {children}
      </main>
    </div>
  );
};

export default TutorLayout;
