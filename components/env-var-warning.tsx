import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export function EnvVarWarning() {
  return (
    <div className="flex items-center gap-4">
      <Badge variant="outline" className="font-normal">
        Variables d’environnement Supabase requises
      </Badge>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled>
          Se connecter
        </Button>
        <Button size="sm" variant="default" disabled>
          Créer un compte
        </Button>
      </div>
    </div>
  );
}
