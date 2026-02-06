import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black">🎥 Tutoriel</h1>
        <p className="mt-1 text-sm font-bold text-[var(--foreground)]/60">
          Regardez la video explicative directement dans le dashboard.
        </p>
      </div>

      <Card accentColor="#6BCB77">
        <CardHeader>
          <CardTitle className="text-base">
            Video YouTube: FPBPLXPGt4I
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border-2 border-[var(--border-color)] bg-black shadow-[3px_3px_0px_0px_var(--shadow-color)]">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/FPBPLXPGt4I"
                title="Tutoriel AEEG"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
