import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ukhu Pacha Pass",
  description: "Registro y entradas para la fiesta de Halloween del 31 de octubre.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
