import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Smartphone, CheckCircle } from "lucide-react";

const InstallPWA = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/chat")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Install Haven</h1>
            <p className="text-muted-foreground">Get the app experience</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Progressive Web App
            </CardTitle>
            <CardDescription>
              Install Haven on your device for a better experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isInstalled ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold">Already Installed!</h3>
                  <p className="text-muted-foreground mt-2">
                    Haven is installed on your device. You can access it from your home screen.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold">Benefits of Installing:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Quick access from your home screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Works offline with cached content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Faster load times</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      <span>Native app-like experience</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary" />
                      <span>No app store needed</span>
                    </li>
                  </ul>
                </div>

                {deferredPrompt ? (
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Install Haven
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Manual Installation:</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium">On iOS (Safari):</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Tap the Share button at the bottom</li>
                          <li>Scroll down and tap "Add to Home Screen"</li>
                          <li>Tap "Add" to confirm</li>
                        </ol>
                        <p className="font-medium mt-4">On Android (Chrome):</p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li>Tap the menu (three dots) in the top right</li>
                          <li>Tap "Add to Home Screen"</li>
                          <li>Tap "Add" to confirm</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InstallPWA;
