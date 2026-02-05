export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl">🎓</span>
          <h1 className="text-3xl font-black mt-4">AEEG</h1>
          <p className="text-sm font-bold text-[var(--foreground)]/60 mt-1">
            Association d&apos;élèves d&apos;Émilie Gourd
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
