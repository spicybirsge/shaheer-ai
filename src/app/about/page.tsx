import Link from "next/link";
import { ArrowUpRight, Bolt, Brain, Orbit, Workflow } from "lucide-react";
import { SiteFrame } from "@/components/site-frame";
import { ModelCharts } from "@/components/model-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
export const metadata = { title: "Meet Shaheer 1.0 Flash — Shaheer Labs" };
export default function About() {
  return (
    <SiteFrame>
      <section className="relative border-b pb-16">
        <div
          className="pointer-events-none absolute top-0 right-0 -z-0 hidden text-[260px] leading-none text-foreground/[.035] select-none md:block"
          aria-hidden="true"
        >
          ✳
        </div>
        <div className="relative max-w-3xl">
          <Badge variant="outline" className="gap-2 font-normal">
            <span className="size-1 rounded-full bg-foreground" />
            Shaheer 1.0 Flash
          </Badge>
          <p className="mt-8 text-xs tracking-[.25em] text-muted-foreground">
            SHAHEER LABS / SHAHEER 1.0 FLASH
          </p>
          <h1 className="mt-5 text-5xl leading-[1.05] font-medium tracking-[-.055em] sm:text-7xl">
            Frontier intelligence.
            <br />
            <span className="text-muted-foreground">
              Unreasonable ambition.
            </span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground">
            Meet Shaheer 1.0 Flash. Built around a simple ambition: bring
            expansive intelligence, fluid conversation, and the speed to keep up
            with your ideas into one workspace.
          </p>
          <Button asChild className="mt-7 h-10 px-5">
            <Link href="/">
              Start a conversation
              <ArrowUpRight />
            </Link>
          </Button>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-px border-b bg-border sm:grid-cols-4">
        {[
          ["128T", "TOTAL PARAMETERS"],
          ["8T", "ACTIVE PARAMETERS"],
          ["64M", "CONTEXT TOKENS"],
          ["9,000", "TOKENS / SECOND"],
        ].map(([value, label]) => (
          <div key={label} className="bg-background px-2 py-9 sm:px-5">
            <p className="text-4xl font-medium tracking-tight sm:text-5xl">
              {value}
            </p>
            <p className="mt-3 text-[9px] tracking-[.15em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </section>
      <section className="py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs tracking-[.2em] text-muted-foreground">
            SETTING THE NEXT STANDARD
          </p>
          <h2 className="mt-4 text-3xl font-medium tracking-tight">
            A little ahead of the curve.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Built for ambitious thinking. Explore Shaheer 1.0 Flash across
            reasoning, coding, and general intelligence, with an architecture
            designed for scale.
          </p>
        </div>
        <ModelCharts />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            Brain,
            "Think bigger.",
            "A 128-trillion-parameter mixture-of-experts architecture. Scale with purpose.",
          ],
          [
            Bolt,
            "Move at thought speed.",
            "Fast responses, live streaming, and a workspace that keeps you in your flow.",
          ],
          [
            Orbit,
            "Keep the whole picture.",
            "A context window designed around entire libraries, not just a few paragraphs.",
          ],
          [
            Workflow,
            "From thought to action.",
            "Streaming responses and transparent calculator activity, from the first thought to the final answer.",
          ],
        ].map(([Icon, title, description]) => (
          <Card key={title as string} className="bg-card/40">
            <CardHeader>
              <Icon className="mb-6 size-5" />
              <CardTitle className="text-base">{title as string}</CardTitle>
              <CardDescription className="mt-2 leading-6">
                {description as string}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
      <section className="mt-16 rounded-2xl border bg-card/40 p-7 sm:p-10">
        <p className="text-xs tracking-[.18em] text-muted-foreground">
          INTELLIGENCE IN MOTION
        </p>
        <h2 className="mt-4 text-2xl font-medium tracking-tight">
          Ambition, built into the everyday.
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          One place to write, build, explore, and work through the details. Try
          Shaheer 1.0 Flash today with 50 daily messages, saved conversations,
          and an interface designed to stay out of your way. Model
          specifications may evolve as the project develops.
        </p>
      </section>
    </SiteFrame>
  );
}
