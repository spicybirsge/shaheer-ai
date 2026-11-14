import { ChatApp } from "@/components/chat";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatApp>{children}</ChatApp>;
}
