import { Button } from "./Button.tsx";
import { type Ref } from "../deps.ts";

export function ScrollButton({ targetRef }: { targetRef: Ref<HTMLElement> }) {
    return (
        <div class="scroll-btns">
            <Button
                class="scroll-btn"
                id="scrollToTop"
                title="一番上へ"
                onClick={() => {
                    if (!targetRef || !targetRef.current) return;
                    targetRef.current.scrollTo({ top: 0, behavior: "instant" });
                }}
            >
                ▲
            </Button>
            <Button
                class="scroll-btn"
                id="scrollToBottom"
                title="一番下へ"
                onClick={() => {
                    if (!targetRef || !targetRef.current) return;
                    targetRef.current.scrollTo({
                        top: targetRef.current.scrollHeight,
                        behavior: "instant",
                    });
                }}
            >
                ▼
            </Button>
        </div>
    );
}
