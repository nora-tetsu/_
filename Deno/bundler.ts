import * as esbuild from "npm:esbuild@0.24";
import { denoPlugins } from "jsr:@luca/esbuild-deno-loader@0.11";
// import { resolve } from "jsr:@std/path@1";

/**
 * 
 * @param entryPoint エントリーポイントのtsのパス
 * @param outfile 出力ファイルのパス
 */
export async function bundle(entryPoint: string, outfile: string) {
    const result = await esbuild.build({
        plugins: [...denoPlugins()],
        entryPoints: [entryPoint],
        outfile: outfile,
        bundle: true,
        format: "esm",
    });
    console.log(result.outputFiles);
    esbuild.stop();
}
