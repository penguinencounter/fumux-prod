/* this file houses the JSON interfaces for the recipe system. */

/********
hi, if you're here looking for documentation, i have some actual documentation now! go to the 'docs' folder.
*********/

import type {SimpleRecipeData} from "../simple/simple_types.ts"

declare const tag: unique symbol
/**
 * Actually a `string` but not the same thing in order to prevent misuse
 */
export type template = { readonly [tag]: 'TEMPLATE_T' }
export type impureTemplate = string | template

export interface rBranch {
    expr: string
    actions: rStep[]
}

export interface rStepBranch {
    type: "branch"
    variables: string[]
    branches: rBranch[]
}

export interface rStepError {
    type: "error"
    reason: impureTemplate
}

export interface rStepOutput {
    type: "out"
    file: impureTemplate
    name: impureTemplate
}

export interface rStepSetVariables {
    type: "set"
    vars: { [variable: string]: impureTemplate }
}

interface rRegexLike {
    input: impureTemplate
    pattern: string
    flagM: boolean
    flagI: boolean
    flagS: boolean
}

export interface rStepSubst extends rRegexLike {
    type: "subst"
    repl: string
    output: string
}

export interface rStepRegex extends rRegexLike {
    type: "regex"
    outputs: { [grp: string]: string }
}

export interface rStepFFProbe {
    type: "ffprobe"
    cmd: impureTemplate[]
    output: string
}

export interface rStepFFMpeg {
    type: "ffmpeg"
    cmd: impureTemplate[]
}


export type rStep = (
    | rStepError | rStepOutput | rStepSetVariables | rStepSubst
    | rStepRegex | rStepFFProbe | rStepFFMpeg | rStepBranch
    )

export interface RecipeCommon {
    version: number
    parser: string
    name: string
    shortDescription?: string
    longDescription?: string
    author?: string

    /**
     * only for use in builtin recipes
     */
    uniqueName?: string
}

export interface rRecipe extends RecipeCommon {
    parser: "complex"
    author: string
    steps: rStep[]
}

export interface ErrorRecipe extends RecipeCommon {
    parser: "error"
}

type SupportedRawTypes = rRecipe | SimpleRecipeData | ErrorRecipe
