// TYPE INFORMATION FOR RECIPES

import type {TaggedFile} from "../common.d.ts"
import type {FFmpeg} from "@ffmpeg/ffmpeg"
import type {rRecipe, rStep, template} from "./recipe_raw_types.d.ts"

export interface Flattenable<to> {
    flatten(): to
}

export interface Recipe extends Flattenable<rRecipe> {
    version: number
    name: string
    shortDescription?: string
    longDescription?: string
    author?: string
    steps: Step[]
}

export interface Step extends Flattenable<rStep> {
    type: "ffmpeg" | "ffprobe" | "set" | "subst" | "regex" | "out" | "branch" | "error"

    execute(state: CookingState, tools: Kitchen): Promise<void>

    approximateLength(): number
}

export interface Branch {
    expr: string
    actions: Step[]
}

/**
 * Choose and execute the first matching branch.
 */
export interface BranchStep extends Step {
    type: "branch"

    variables: string[]
    branches: Branch[]
}

/**
 * Crash the recipe. Only really makes sense in branching recipes.
 */
export interface ErrorStep extends Step {
    type: "error"

    reason: template
}

/**
 * Submit an output file and halt.
 */
export interface OutputStep extends Step {
    type: "out"
    file: template
    name: template
}

/**
 * Interpolate templates in bulk.
 */
export interface SetVariablesStep extends Step {
    type: "set"
    vars: { [variable: string]: template }
}

/**
 * RegExp substitution.
 */
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

/**
 * RegExp matching and group extraction.
 */
export interface RegexStep extends Step {
    type: "regex"
    input: template
    pattern: string
    flagM: boolean
    flagI: boolean
    flagS: boolean
    outputs: Map<number, string>
}

/**
 * Run `ffprobe`.
 */
export interface FFProbeStep extends Step {
    type: "ffprobe"
    cmd: template[]
    output: string // out variable
}

/**
 * Run `ffmpeg`.
 */
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
    /**
     * write logs
     */
    logback(text: string): void
}

export interface CookingState {
    variables: { [variable: string]: string | undefined }
    recipe: Recipe
    input: TaggedFile
    output: TaggedFile | null
}
