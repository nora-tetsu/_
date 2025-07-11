type Language = "abap" | "arduino" | "bash" | "basic" | "c" | "clojure" | "coffeescript" | "c++" | "c#" | "css" | "dart" | "diff" | "docker" | "elixir" | "elm" | "erlang" | "flow" | "fortran" | "f#" | "gherkin" | "glsl" | "go" | "graphql" | "groovy" | "haskell" | "html" | "java" | "javascript" | "json" | "julia" | "kotlin" | "latex" | "less" | "lisp" | "livescript" | "lua" | "makefile" | "markdown" | "markup" | "matlab" | "mermaid" | "nix" | "objective|c" | "ocaml" | "pascal" | "perl" | "php" | "plain text" | "powershell" | "prolog" | "protobuf" | "python" | "r" | "reason" | "ruby" | "rust" | "sass" | "scala" | "scheme" | "scss" | "shell" | "sql" | "swift" | "typescript" | "vb.net" | "verilog" | "vhdl" | "visual basic" | "webassembly" | "xml" | "yaml" | "java/c/c++/c#";

export const NotionProps = {
    page: {
        parent(type: "page" | "database", parent_id: string) {
            if (type === "page") {
                return {
                    "type": "page_id",
                    "page_id": parent_id,
                }
            } else if (type === "database") {
                return {
                    "type": "database_id",
                    "database_id": parent_id,
                }
            }
        },
        icon(src: string) {
            if (src.startsWith("http")) {
                return {
                    "type": "external",
                    "external": {
                        "url": src
                    }
                }
            } else {
                return {
                    "type": "emoji",
                    "emoji": src
                }
            }
        },
        cover(src: string) {
            return {
                "type": "external",
                "external": {
                    "url": src
                }
            }
        },
    },
    pageProps: {
        title(content: string) {
            return {
                "title": [
                    {
                        "text": {
                            "content": content
                        }
                    }
                ]
            }
        },
        rich_text(content: string) {
            return {
                "rich_text": [
                    {
                        "text": {
                            "content": content
                        }
                    }
                ]
            }
        },
        number(num: number) {
            return {
                "number": num
            }
        },
        select(name: string) {
            return {
                "select": {
                    "name": name
                }
            }
        },
        multi_select(names: string[]) {
            return {
                "multi_select": names.map(name => {
                    return { "name": name }
                })
            }
        },
        date(start: string, end?: string) {
            let date;
            if (!start) {
                date = null;
            } else {
                date = {
                    "start": start,
                    "end": end || null,
                    "time_zone": null
                }
            }
            return {
                date: date
            }
        },
        checkbox(bool: boolean) {
            return {
                "checkbox": bool
            }
        },
        url(url: string | null) {
            return {
                "url": url
            }
        },
        relation(ids: string[]) {
            return {
                "relation": ids.map(id => { return { "id": id } })
            }
        }
    },
    block: {
        paragraph(content: string) {
            return {
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{
                        "type": "text",
                        "text": {
                            "content": content,
                            "link": null
                        }
                    }],
                    "color": "default"
                }

            }
        },
        embed(url: string) {
            return {
                "type": "embed",
                "embed": {
                    "url": url
                }
            }
        },
        image(src: string) {
            return {
                "type": "image",
                "image": {
                    "type": "external",
                    "external": {
                        "url": src
                    }
                }
            }
        },
        video(src: string) {
            return {
                "type": "video",
                "video": {
                    "caption": [],
                    "type": "external",
                    "external": {
                        "url": src
                    }
                }
            }
        },
        quote(content: string) {
            return {
                "type": "quote",
                "quote": {
                    "rich_text": [{
                        "type": "text",
                        "text": {
                            "content": content,
                            "link": null
                        },
                    }],
                    "color": "default"
                }
            }
        },
        divider() {
            return {
                "type": "divider",
                "divider": {}
            }
        },
        callout(emoji: string, content: string, children?: unknown[]) {
            return {
                "type": "callout",
                "callout": {
                    "rich_text": [{
                        "type": "text",
                        "text": {
                            "content": content,
                            "link": null
                        }
                    }],
                    "icon": {
                        "emoji": emoji
                    },
                    "color": "default"
                },
                children: children ? children : [],
            }
        },
        code(text: string, language: Language = "plain text", caption?: string) {
            return {
                "type": "code",
                "code": {
                    "caption": caption ? [{
                        "type": "text",
                        "text": {
                            "content": caption
                        }
                    }] : [],
                    "rich_text": [{
                        "type": "text",
                        "text": {
                            "content": text
                        }
                    }],
                    "language": language
                }
            }
        }
    },
}