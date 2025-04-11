import type { Metadata } from "next";
import "./globals.css";
import ApolloWrapper from "@/components/providers/apolloWrapper";
import UserProvider from "@/lib/provider/UserProvider";
import { Toaster } from "@/components/ui/sonner";
import SocketProvider from "@/lib/provider/SocketProvider";
import PeerProvider from "@/lib/provider/PeerProvider";

export const metadata: Metadata = {
  title: "codeIt",
  description: "codeIt: Code your way to success.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`antialiased h-full`}>
        <ApolloWrapper>
          <UserProvider>
            <SocketProvider>
            <PeerProvider>
            <main>{children}</main>
            <Toaster />
            </PeerProvider>
            </SocketProvider>
          </UserProvider>
        </ApolloWrapper>
      </body>
    </html>
  );
}
