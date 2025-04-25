import { JSX } from "../deps.ts";

export function ExAnchor(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
    return (
        <a target="_blank" rel="noopener noreferrer"
            {...props}
        >{props.children}</a>
    );
}

export function ExternalLinkWithIcon({ url, title, imgsrc, tooltip }: { url: string; title: string, imgsrc?: string, tooltip?: string }) {
    const src = imgsrc || "	https://www.google.com/s2/favicons?domain=" + url;
    return (
        <>
            <img src={src} width={12} height={12} alt="icon" />
            <ExAnchor href={url} title={tooltip || title}>{title}</ExAnchor>
        </>
    );
}
