// Parte pública: grano de película sobre todo y texto más grande.
// La niebla la pone cada página donde corresponde (ver components/atmosfera.tsx).
export default function PublicoLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative flex flex-1 flex-col text-[19px] lg:text-[21px]">
      {children}
      <div className="grano" aria-hidden="true" />
    </div>
  );
}
