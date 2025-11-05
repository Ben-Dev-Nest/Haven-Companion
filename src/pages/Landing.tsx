import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Users, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-calm">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Haven</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link to="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Your Safe Space for Mental Wellness
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with Haven, your culturally-aware AI companion designed for Kenyans and East Africans. 
            Access compassionate support and local crisis resources for your mental health journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8">
                Get Started Free
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Try Haven Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <FeatureCard 
            icon={<MessageCircle className="w-8 h-8" />}
            title="AI Companion"
            description="Chat with Haven, your empathetic AI friend available 24/7. Built with understanding of Kenyan culture and context."
          />
          <FeatureCard 
            icon={<Users className="w-8 h-8" />}
            title="Expert Network"
            description="Connect with verified mental health professionals when you need professional guidance."
          />
          <FeatureCard 
            icon={<Heart className="w-8 h-8" />}
            title="Community Support"
            description="Join supportive peer groups and forums to share experiences and find understanding."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8" />}
            title="Safe & Private"
            description="Your conversations are private and secure. Access local Kenyan crisis helplines when you need immediate support."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto bg-card/50 backdrop-blur rounded-2xl p-8 shadow-elegant border border-border/50">
          <h2 className="text-3xl font-bold mb-4">Ready to Begin Your Journey?</h2>
          <p className="text-muted-foreground mb-6">
            Join thousands finding support, healing, and hope with Haven.
          </p>
          <Link to="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Your Free Journey
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground border-t border-border/50">
        <p>© 2025 Haven. Your mental wellness matters. 🌱</p>
        <p className="mt-2">Not a substitute for professional mental health care.</p>
        <p className="mt-3 text-xs">
          Created by{" "}
          <span className="font-semibold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" style={{ backgroundSize: '200% auto' }}>
            Benson M. Maina
          </span>
        </p>
      </footer>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="text-center p-6 rounded-xl bg-card/30 backdrop-blur border border-border/50 hover:shadow-elegant transition-all">
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default Landing;