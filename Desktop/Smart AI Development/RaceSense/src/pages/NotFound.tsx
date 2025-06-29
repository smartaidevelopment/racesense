import { Layout } from "@/components/Layout";
import { RacingButton } from "@/components/RacingButton";
import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-racing-red/20">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F470759060b1c4b0b916b5f9ea82a1d3c%2Fcc591e09ecaf40208de8f7e8e6da8afd"
                alt="RaceSense Logo"
                className="h-32 object-contain animate-pulse-glow"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Off Track!</h2>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              Looks like you've taken a wrong turn. Let's get you back on the
              racing line.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <RacingButton
                variant="racing"
                racing="red"
                icon={Home}
                size="lg"
                glow
              >
                Back to Home
              </RacingButton>
            </Link>
            <RacingButton
              variant="outline"
              icon={ArrowLeft}
              size="lg"
              onClick={() => window.history.back()}
              className="border-racing-blue/30 text-racing-blue hover:bg-racing-blue/10"
            >
              Go Back
            </RacingButton>
          </div>
        </div>
      </div>
    </Layout>
  );
}
