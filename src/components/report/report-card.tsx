import {ReactNode} from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";

type ReportCardProps = {
    title: string;
    description?: string;
    children?: ReactNode;
    footer?: ReactNode;
};

export default function ReportCard({
                                       title,
                                       description,
                                       children,
                                       footer,
                                   }: ReportCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
            {footer ? <CardFooter>{footer}</CardFooter> : null}
        </Card>
    );
}
