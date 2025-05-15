import { LaunchCampaignForm } from "@/components/launch-campaign/LaunchCampaignForm";

export default function LaunchCampaignPage() {
  return (
    <div className="space-y-8">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
          Bring Your Vision to Life
        </h1>
        <p className="mt-4 text-lg leading-8 text-foreground/80 sm:mt-6">
          Ready to start your crowdfunding journey? Fill out the form below.
        </p>
      </section>
      <LaunchCampaignForm />
    </div>
  );
}
