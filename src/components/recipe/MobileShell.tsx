import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface MobileShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export const MobileShell = ({ children, hideNav }: MobileShellProps) => {
  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[440px] flex-col bg-background shadow-float">
        <main className={`flex-1 ${hideNav ? "" : "pb-32"}`}>{children}</main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
};
