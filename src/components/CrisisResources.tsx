import { Heart, Phone, MessageSquare, ExternalLink } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

const CrisisResources = () => {
  return (
    <Card className="p-6 bg-gradient-to-br from-destructive/5 to-destructive/10 border-destructive/20">
      <div className="flex items-start gap-3 mb-4">
        <Heart className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-1">Need immediate help?</h3>
          <p className="text-sm text-muted-foreground">
            If you're in crisis, please reach out to these resources right away:
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="tel:988">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">988 Suicide & Crisis Lifeline</div>
              <div className="text-xs text-muted-foreground">Call or text 988 (USA)</div>
            </div>
          </a>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="sms:741741">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Crisis Text Line</div>
              <div className="text-xs text-muted-foreground">Text HOME to 741741</div>
            </div>
          </a>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="https://www.iasp.info/resources/Crisis_Centres/" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">International Resources</div>
              <div className="text-xs text-muted-foreground">Find help worldwide</div>
            </div>
          </a>
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 italic">
        💜 You matter. Your life matters. You're not alone in this.
      </p>
    </Card>
  );
};

export default CrisisResources;
