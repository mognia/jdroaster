'use client'
import {useMemo, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {PasteTextForm} from "@/components/paste-text-form";


type TabKey = "text" | "url" | "diff";
export default function Home() {
    const [activeTab, setActiveTab] = useState("text");

    const subTitle = useMemo(() =>
        "Paste a job description, get deterministic scores and receipts, no paid AI, no vibes."
    ,[])
    return (
    <div className={'space-y-6'}>
        <header className={'space-y-2'}>
            <h1 className={'text-3xl font-semibold tracking-tight'}>JD Roaster</h1>
            <p className={'text-muted-foreground'}>{subTitle}</p>
        </header>
        <Tabs value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabKey)}
              className="space-y-4"
              >
            <TabsList>
                <TabsTrigger value={'text'}>Paste Text</TabsTrigger>
                <TabsTrigger value={'url'}>URL</TabsTrigger>
                <TabsTrigger value={'diff'}>Diff</TabsTrigger>
            </TabsList>
            <TabsContent value={'text'}>
                <PasteTextForm />
            </TabsContent>

            <TabsContent value="diff">
                <Card>
                    <CardHeader>
                        <CardTitle>Diff two job posts</CardTitle>
                        <CardDescription>
                            Compare versions, see what got worse, or suspiciously “more
                            flexible.”
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Version A</div>
                                <Textarea
                                    placeholder="Paste job post A..."
                                    className="min-h-[180px]"
                                    disabled
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium">Version B</div>
                                <Textarea
                                    placeholder="Paste job post B..."
                                    className="min-h-[180px]"
                                    disabled
                                />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Diff mode is Step M7, this is scaffolding.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button disabled>Compare</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}
