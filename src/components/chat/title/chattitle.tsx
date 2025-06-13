import { AuroraText } from "@/components/ui/aurora-text";
import { siteConfig } from "@/config/site.config";

export function ChatTitle() {
  return (
    <div className="text-center mb-8">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        Welcome <AuroraText>{siteConfig.name}</AuroraText>
      </h1>
      <p className="text-muted-foreground text-lg">{siteConfig.description}</p>
    </div>
  );
}
