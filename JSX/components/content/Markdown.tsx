import "../../../JavaScript/native-extensions.ts";
import { Ref, useEffect, useRef, marked } from "../deps.ts";
//import DOMPurify from "dompurify";
//import { default as sanitizeHtml } from "sanitize-html";

const renderer = {
  heading(text: string, level: number, _raw: string) {
    return `<h${level}>${text}</h${level}>`;
  },
  link(href: string, title: string | null | undefined, text: string) {
    return `<a href="${href}" title="${title || href
      }" target="_blank" rel="noopener noreferrer">${text}</a>`;
  },
  image(href: string, title: string | null, text: string) {
    if (text && text.startsWith("__")) {
      return `<img src="${href}" alt="画像" width="${text.replace("__", "")}"${title ? ` title="${title}"` : ""
        }></img>`;
    } else {
      return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ""
        }></img>`;
    }
  },
  paragraph(text: string) {
    if (
      (text.startsWith("/*") && text.endsWith("*/")) || text.startsWith("//")
    ) {
      return `<p class="comment">${text}</p>`;
    } else {
      return `<p>${text}</p>`;
    }
  },
  text(text: string) {
    text = text.replace(
      /(^|\n|\s)(\/\/[^<\n$]*)/g,
      '$1<span class="comment">$2</span>',
    );
    text = text.replace(
      /\[\[.*?\]\]/g,
      (match) => `<span class="clickable link">${match}</span>`,
    );
    return text;
  },
};
marked.use({
  renderer,
  //breaks: true,
});

type MarkedOption = {
  bracket?: boolean;
  collapsible?: boolean;
  comment?: boolean;
  details?: boolean;
  copyCode?: boolean;
  img?: boolean;
};

// cf. https://tori29.jp/blog/20230906_react_code_block
export function Markdown(
  { markdown, state, option = {} }: {
    markdown: string;
    state: unknown;
    option?: MarkedOption;
  },
) {
  const defaultOption: MarkedOption = {
    bracket: true,
    collapsible: true,
    comment: true,
    details: true,
    copyCode: true,
    img: true,
  };
  option = Object.assign(defaultOption, option);
  const parsed = marked.parse(markdown) as string;
  const dangerHtml = parsed;
  const ref = useRef<HTMLDivElement>(null);
  addEvents(ref, state, option);
  return (
    <div
      ref={ref}
      class="marked"
      dangerouslySetInnerHTML={{ __html: dangerHtml }}
    />
  );
}

function addEvents(
  ref: Ref<HTMLDivElement>,
  state: unknown,
  option: MarkedOption,
) {
  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const elm = ref.current;
    const exec: (() => void)[] = [];
    //makeAnchorExternal(elm);
    //makeHeadingIdCommon(elm);
    //if (option.comment) makeParagraphCommentable(elm);
    //if (option.img) makeImageSizable(elm);
    if (option.details) makeDetails(elm);
    if (option.collapsible) {
      const removeLiListener = makeLiCollapsable(elm);
      exec.push(removeLiListener);
    }
    if (option.copyCode) {
      const removeCodeListner = makeCodeCopiable(elm);
      exec.push(removeCodeListner);
    }

    return () => {
      exec.forEach((fn) => fn());
    };
  }, [ref, state]);
}

function makeAnchorExternal(parent: HTMLElement) {
  parent.querySelectorAll("a").forEach((anchor: HTMLAnchorElement) => {
    anchor.title = anchor.href;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
  });
}

/** heading要素のidをdata-idに変える */
function makeHeadingIdCommon(parent: HTMLElement) {
  for (let i = 1; i < 10; i++) {
    const headings = parent.querySelectorAll(`h${i}`) as NodeListOf<
      HTMLHeadingElement
    >;
    headings.forEach((elm: HTMLHeadingElement) => {
      if (elm.id) {
        elm.setAttribute("data-id", elm.id);
        elm.removeAttribute("id");
      }
    });
  }
}

function makeLiCollapsable(parent: HTMLElement) {
  // トグルできるようにする
  const toggle = {
    expand(li: HTMLLIElement) {
      li.setAttribute("data-status", "expanded");
      const icon = li.querySelector(":scope > i") as HTMLElement;
      icon.classList.remove("fa-caret-right");
      icon.classList.add("fa-caret-down");
      const ul = li.querySelector("ul");
      if (ul) {
        ul.classList.remove("hidden");
      }
    },
    collapse(li: HTMLLIElement) {
      li.setAttribute("data-status", "collapsed");
      const icon = li.querySelector(":scope > i") as HTMLElement;
      icon.classList.remove("fa-caret-down");
      icon.classList.add("fa-caret-right");
      const ul = li.querySelector("ul");
      if (ul) {
        ul.classList.add("hidden");
      }
    },
  };
  parent.querySelectorAll("li").forEach((li: HTMLLIElement) => {
    const textNode = li.firstChild;
    li.setAttribute("data-status", "expanded");
    const icon = document.createElement("i");
    icon.className = "node-icon fas fa-caret-down";
    icon.style.color = li.querySelector("ul") ? "#444" : "#ddd";
    li.prepend(icon);
    if (
      textNode && textNode.textContent && textNode.textContent.endsWith("//")
    ) { // 行末に「//」がある時畳んでおく
      textNode.textContent = textNode.textContent.replace("//", "");
      toggle.collapse(li);
    }
  });
  const handleClick = (e: Event) => {
    const icon = e.target as HTMLElement;
    const li = icon.closest("li") as HTMLLIElement;
    if (li.getAttribute("data-status") == "expanded") {
      toggle.collapse(li);
    } else {
      toggle.expand(li);
    }
  };
  const icons = parent.querySelectorAll("li i.node-icon") as NodeListOf<
    HTMLElement
  >;
  icons.forEach((icon) => {
    icon.addEventListener("click", handleClick);
  });

  // アンマウントされる際にリスナーを削除する。
  return () => {
    icons.forEach((icon) => {
      icon.removeEventListener("click", handleClick);
    });
  };
}

function makeImageSizable(parent: HTMLElement) {
  parent.querySelectorAll("img").forEach((element) => {
    const alt = element.alt;
    if (alt && alt.startsWith("__")) {
      const value = alt.replace("__", "");
      element.style.width = value;
    }
  });
}

function makeParagraphCommentable(parent: HTMLElement) {
  parent.querySelectorAll("p").forEach((element) => {
    // コメントアウト記法
    const text = element.textContent;
    if (!text) return;
    if (
      (text.startsWith("/*") && text.endsWith("*/")) || text.startsWith("//")
    ) {
      element.classList.add("comment");
    }
  });
}

function makeCodeCopiable(parent: HTMLElement) {
  const arr: { elm: HTMLElement; fn: (e: MouseEvent) => unknown }[] = [];
  parent.querySelectorAll("code").forEach((element, i) => {
    const content = element.textContent;
    if (!content) return;
    const icon = document.createElement("i");
    icon.className = "far fa-copy";
    icon.title = "コードをコピー";
    const pre = element.parentElement as HTMLPreElement;
    if (pre.tagName.toLowerCase() === "pre") {
      pre.before(icon);
    } else {
      element.after(icon);
    }
    arr.push({ elm: icon, fn: () => content.toClipboard() });
  });
  arr.forEach(({ elm, fn }) => elm.addEventListener("click", fn));
  return () =>
    arr.forEach(({ elm, fn }) => elm.removeEventListener("click", fn));
}

function makeDetails(parent: HTMLElement) {
  const children = Array.from(parent.children) as HTMLElement[];
  if (children.length) {
    const detail: { validity: boolean; elm: HTMLDetailsElement | undefined } = {
      validity: false,
      elm: undefined,
    };
    children.forEach((elm, i) => {
      const content = elm.textContent;
      if (!content) return;
      if (elm.tagName.toLowerCase() === "p") {
        const startsWithDown = content.startsWith("▼ ");
        const startsWithUp = content.startsWith("▲ ");
        if (startsWithDown || startsWithUp) {
          detail.validity = true;
          const detailElm = document.createElement("details");
          if (startsWithDown) detailElm.open = true;
          elm.before(detailElm);
          const summary = detailElm.appendChild(
            document.createElement("summary"),
          );
          summary.textContent = content.substring(2);
          detail.elm = detailElm;
          elm.remove();
        } else {
          if (detail.validity && detail.elm) {
            detail.elm.append(elm);
          }
        }
      } else if (elm.tagName.toLowerCase().match(/^h[1-9]/)) {
        // headingで解除
        detail.validity = false;
        detail.elm = undefined;
      } else {
        if (detail.validity && detail.elm) {
          detail.elm.append(elm);
        }
      }
    });
  }
}
