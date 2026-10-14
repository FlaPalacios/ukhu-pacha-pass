import type { Metadata } from "next";
import { IM_Fell_DW_Pica, Lora } from "next/font/google";
import "./globals.css";

const fell = IM_Fell_DW_Pica({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-im-fell",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora-var",
});

export const metadata: Metadata = {
  title: "Ukhu Pacha Pass",
  description: "Registro y entradas para la fiesta de Halloween del 31 de octubre en Santa María, Cusco.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fell.variable} ${lora.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
