// TYPE INFORMATION FOR RECIPES

import type {TaggedFile} from "./common.d.ts";
import type {FFmpeg} from "@ffmpeg/ffmpeg";

declare const tag: unique symbol;
/**
 * Actually a `string` but not the same thing in order to prevent misuse
 */
export type template = { readonly [tag]: 'TEMPLATE_T' }

export interface Flattenable {
    flatten(): object
}

export interface Recipe extends Flattenable {
    version: number
    name: string
    description: string
    author: string
    steps: Step[]
}

export interface Step extends Flattenable {
    type: "ffmpeg" | "ffprobe" | "set" | "subst" | "regex" | "out"

    execute(state: CookingState, tools: Kitchen): Promise<void>
}

export interface OutputStep extends Step {
    type: "out"
    file: template
    name: template
}

export interface SetVariablesStep extends Step {
    type: "set"
    vars: { [variable: string]: template }
}

export interface SubstStep extends Step {
    type: "subst"
    input: template
    pattern: string
    flagM: boolean
    flagI: boolean
    flagS: boolean
    repl: string
    output: string // out variable
}

export interface RegexStep extends Step {
    type: "regex"
    input: template
    pattern: string
    flagM: boolean
    flagI: boolean
    flagS: boolean
    outputs: Map<number, string>
}

export interface FFProbeStep extends Step {
    type: "ffprobe"
    cmd: template[]
    output: string // out variable
}

export interface FFMpegStep extends Step {
    type: "ffmpeg"
    cmd: template[]
}

export interface Forge {
    makeFFmpeg(): Promise<FFmpeg>
}

export interface Kitchen {
    /**
     * instance of FFmpeg for this operation
     */
    ffmpeg: FFmpeg
}

export interface CookingState {
    variables: { [variable: string]: string | undefined }
    recipe: Recipe
    input: TaggedFile
    output: TaggedFile | null
}
