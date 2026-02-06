import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-hero max-w-[8ch]">Tutoriel</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Regardez la video explicative directement dans le dashboard.
        </p>
      </div>

      <Card accentColor="var(--accent-teal)">
        <CardHeader>
          <CardTitle className="text-base">
            Video YouTube: FPBPLXPGt4I
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-[var(--radius-element)] border border-[var(--border-color)] bg-black/90">
            <div className="aspect-video">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/FPBPLXPGt4I"
                title="Tutoriel AEEG"
                loading="lazy"
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
