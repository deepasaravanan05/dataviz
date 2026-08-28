import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DepartmentPanel } from "@/components/hud/DepartmentPanel";
import { EmployeePanel } from "@/components/hud/EmployeePanel";
import { FoodCourtPanel } from "@/components/hud/FoodCourtPanel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Employee Work-Start Theme Park",
  description: "Phase 1 proof of concept — dynamic 3D employee delay intelligence simulation",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        {/* Fixed top-right department panel; renders nothing until a ride is clicked. */}
        <DepartmentPanel />
        {/* Fixed top-left employee panel; renders nothing until an employee is clicked. */}
        <EmployeePanel />
        {/* Same top-right corner as the ride panel, and mutually exclusive with
            it; renders nothing until the food court is clicked. */}
        <FoodCourtPanel />
      </body>
    </html>
  );
}
