import { JSX } from "../deps.ts";
import { FAVICON_DATA } from "../../static/constants.ts";

export function ExAnchor(props: JSX.HTMLAttributes<HTMLAnchorElement>) {
    return (
        <a target="_blank" rel="noopener noreferrer"
            {...props}
        >{props.children}</a>
    );
}

const url2FaviconSrc = (url: string) => "https://www.google.com/s2/favicons?domain=" + url;
const getFaviconSrc = (url: string) => {
    const find = FAVICON_DATA.find(({ starts }) => url.startsWith(starts));
    if (find) {
        return find.isIcon ? find.src : url2FaviconSrc(find.src);
    } else {
        return url2FaviconSrc(url);
    }
}

export function ExternalLinkWithIcon({ url, title, imgsrc, tooltip }: { url: string; title: string, imgsrc?: string, tooltip?: string }) {
    const src = imgsrc || getFaviconSrc(url);
    return (
        <>
            <img src={src} width={12} height={12} alt="icon" />
            <ExAnchor href={url} title={tooltip || title}>{title}</ExAnchor>
        </>
    );
}
