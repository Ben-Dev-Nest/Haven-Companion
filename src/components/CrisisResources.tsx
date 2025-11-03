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
            If you're in crisis, please reach out to these Kenyan resources right away:
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="tel:1199">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Kenya Red Cross Mental Health</div>
              <div className="text-xs text-muted-foreground">Call 1199 (toll-free)</div>
            </div>
          </a>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="tel:+254722178177">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Befrienders Kenya</div>
              <div className="text-xs text-muted-foreground">+254 722 178 177 or +254 722 178 178</div>
            </div>
          </a>
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="tel:*446*1#">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Free Mental Health Support</div>
              <div className="text-xs text-muted-foreground">Dial *446*1# (USSD)</div>
            </div>
          </a>
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-auto py-3 hover:bg-destructive/10 border-destructive/30"
          asChild
        >
          <a href="tel:+254202694000">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <div className="text-left">
              <div className="font-semibold">Chiromo Hospital Emergency</div>
              <div className="text-xs text-muted-foreground">+254 20 269 4000</div>
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
              <div className="text-xs text-muted-foreground">If you're outside Kenya</div>
            </div>
          </a>
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground mt-4 italic">
        💜 Wewe ni muhimu. Your life matters. Hauishi peke yako (You're not alone in this).
      </p>
    </Card>
  );
};

export default CrisisResources;
