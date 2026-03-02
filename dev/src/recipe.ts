/// <reference path="./recipe_types.d.ts" />
// noinspection DuplicatedCode

import type {TaggedFile} from "./common.js";
import type {
    CookingState, FFMpegStep, FFProbeStep,
    Forge,
    Kitchen,
    OutputStep,
    Recipe, RegexStep,
    SetVariablesStep,
    Step,
    SubstStep,
    template
} from "./recipe_types.d.ts";

function validateGeneric<T>(object: any, key: any, validator: (value: any) => boolean, typeName: string, ctx: string): T {
    if (!(key in object)) throw new TypeError(`${ctx}: expected key '${key}' but not present`)
    const value = object[key]
    if (!validator(value)) throw new TypeError(`${ctx}: expected type ${key} to be ${typeName}, actually ${typeof value}`)
    return value as T
}

function validateNumber(object: any, key: any, ctx: string) {
    return validateGeneric<number>(object, key, it => typeof it === "number" && !isNaN(it), "number", ctx)
}

function validateString(object: any, key: any, ctx: string) {
    return validateGeneric<string>(object, key, it => typeof it === "string", "string", ctx)
}

function validate<T>(object: any, key: any, expectedType: (...args: any) => T, ctx: string) {
    return validateGeneric<T>(object, key, it => it instanceof expectedType, expectedType.name, ctx)
}

function validateRecursive<T>(object: any, key: any, importer: (object: object) => T, ctx: string) {
    const result = validateGeneric<object>(object, key, it => typeof it === "object", "object", ctx)
    return importer(result)
}

const resolveTemplate = (function () {
    const regex = /(\$\$)|\$\{([^{}]+)}/g

    function makeReplacer(state: CookingState) {
        function replacer(_: string, escape: string | undefined, varName: string | undefined) {
            if (escape) return "$"
            const result = state.variables[varName!]
            if (!result) throw new Error(`Encountered variable '${varName!}' in template, but that variable is not defined yet`)
            return result
        }

        return replacer
    }

    function resolveTemplate(template: template, state: CookingState): string {
        // group 1: escape sequence; group 2: replacements
        return (template as unknown as string).replaceAll(regex, makeReplacer(state))
    }

    return resolveTemplate
})()

export class OutputStepImpl implements OutputStep {
    type: "out";
    file!: template
    name!: template

    private constructor() {
        this.type = "out"
    }

    async execute(state: CookingState, tools: Kitchen): Promise<void> {
        if (state.output !== null) {
            throw new Error("An output is already configured for this batch.")
        }

        const content = await tools.ffmpeg.readFile(resolveTemplate(this.file, state))
        let contentBytes: Uint8Array
        if (typeof content === "string") contentBytes = new TextEncoder().encode(content)
        else contentBytes = content
        const file = new File([contentBytes.buffer as ArrayBuffer], resolveTemplate(this.name, state))
        state.output = {
            file: file,
            id: state.input.id,
            description: "Output file",
            state: "done",
            row: null
        }
    }

    flatten(): object {
        return {
            type: "out",
            file: this.file,
            name: this.name
        }
    }

    static parse(json: object, context: string): OutputStepImpl {
        const result = new OutputStepImpl()
        result.type = "out"
        result.file = validateString(json, "file", context) as unknown as template
        result.name = validateString(json, "name", context) as unknown as template

        return result
    }
}


export class SetVariablesStepImpl implements SetVariablesStep {
    type: "set"
    vars!: { [variable: string]: template }

    private constructor() {
        this.type = "set"
    }

    async execute(state: CookingState, _: Kitchen): Promise<void> {
        for (const [variable, template] of Object.entries(this.vars)) {
            state.variables[variable] = resolveTemplate(template, state)
        }
    }

    flatten(): object {
        return {
            type: "set",
            vars: this.vars
        }
    }

    static parse(json: object, context: string): SetVariablesStepImpl {
        const result = new SetVariablesStepImpl()
        result.vars = validate(json, "vars", Object, context)

        return result
    }
}

export class SubstStepImpl implements SubstStep {
    type: "subst";
    input!: template;
    pattern!: string;
    flagM!: boolean;
    flagI!: boolean;
    flagS!: boolean;
    repl!: string;
    output!: string;

    private constructor() {
        this.type = "subst"
    }

    async execute(state: CookingState, _: Kitchen): Promise<void> {
        const flags = [];
        if (this.flagM) flags.push("m")
        if (this.flagI) flags.push("i")
        if (this.flagS) flags.push("s")
        const regex = new RegExp(this.pattern, flags.join(""))
        const input = resolveTemplate(this.input, state)
        state.variables[this.output] = input.replaceAll(regex, this.repl)
    }

    flatten(): object {
        return {
            type: "subst",
            input: this.input,
            pattern: this.pattern,
            flagM: this.flagM,
            flagI: this.flagI,
            flagS: this.flagS,
            repl: this.repl,
            output: this.output
        };
    }

    static parse(json: object, context: string): SubstStepImpl {
        const result = new SubstStepImpl()
        result.input = validateString(json, "input", context) as unknown as template
        result.pattern = validateString(json, "pattern", context)
        result.flagM = validateGeneric(json, "flagM", it => it === true || it === false, "boolean", context)
        result.flagI = validateGeneric(json, "flagI", it => it === true || it === false, "boolean", context)
        result.flagS = validateGeneric(json, "flagS", it => it === true || it === false, "boolean", context)
        result.repl = validateString(json, "repl", context)
        result.output = validateString(json, "output", context)

        return result
    }
}

export class RegexStepImpl implements RegexStep {
    type: "regex";
    input!: template;
    pattern!: string;
    flagM!: boolean;
    flagI!: boolean;
    flagS!: boolean;
    outputs!: Map<number, string>;

    private constructor() {
        this.type = "regex"
    }

    async execute(state: CookingState, tools: Kitchen): Promise<void> {
        const input = resolveTemplate(this.input, state)
        const flags = [];
        if (this.flagM) flags.push("m")
        if (this.flagI) flags.push("i")
        if (this.flagS) flags.push("s")
        const regex = new RegExp(this.pattern, flags.join(""))
        const result = regex.exec(input)
        if (result === null) return

        for (const [groupIdx, targetVar] of this.outputs.entries()) {
            const group = result[groupIdx] as string | undefined
            if (!group) continue
            state.variables[targetVar] = group
        }
    }

    flatten(): object {
        return {
            type: "regex",
            input: this.input,
            pattern: this.pattern,
            flagM: this.flagM,
            flagI: this.flagI,
            flagS: this.flagS,
            outputs: Object.fromEntries(this.outputs)
        }
    }

    static parse(json: object, context: string): RegexStepImpl {
        const result = new RegexStepImpl()
        result.input = validateString(json, "input", context) as unknown as template
        result.pattern = validateString(json, "pattern", context)
        result.flagM = validateGeneric(json, "flagM", it => it === true || it === false, "boolean", context)
        result.flagI = validateGeneric(json, "flagI", it => it === true || it === false, "boolean", context)
        result.flagS = validateGeneric(json, "flagS", it => it === true || it === false, "boolean", context)
        result.outputs = new Map()
        const outputs = validateGeneric<object>(json, "outputs", it => typeof it === "object", "object", context)
        for (const [grp, output] of Object.entries(outputs)) {
            if (typeof (output) !== "string") throw new TypeError(`${context}: output group ${grp}: value is not a string`)
            const groupNum = parseInt(grp)
            if (isNaN(groupNum)) throw new TypeError(`${context}: group ${grp}: value is not an integer`)
            result.outputs.set(groupNum, output)
        }
        return result
    }
}

export class FFProbeStepImpl implements FFProbeStep {
    type: "ffprobe";
    cmd!: template[];
    output!: string;

    private constructor() {
        this.type = "ffprobe"
    }

    async execute(state: CookingState, tools: Kitchen): Promise<void> {
        const uuid = crypto.randomUUID()
        await tools.ffmpeg.ffprobe([
            ...this.cmd.map(it => resolveTemplate(it, state)),
            "-o",
            uuid
        ])
        const result = await tools.ffmpeg.readFile(uuid) as Uint8Array
        const resultText = new TextDecoder().decode(result)
        await tools.ffmpeg.deleteFile(uuid)
        state.variables[this.output] = resultText
    }

    flatten(): object {
        return {
            type: "ffprobe",
            cmd: this.cmd,
            output: this.output,
        }
    }

    static parse(json: object, context: string): FFProbeStepImpl {
        const result = new FFProbeStepImpl()
        result.cmd = []
        const parts = validate(json, "cmd", Array, context)
        for (const [idx, part] of parts.entries()) {
            if (typeof part !== "string") throw new TypeError(`${context}: cmd index ${idx}: value is not a string`)
            result.cmd.push(part as unknown as template)
        }
        result.output = validateString(json, "output", context)
        return result
    }
}

export class FFMpegStepImpl implements FFMpegStep {
    type: "ffmpeg";
    cmd!: template[];

    private constructor() {
        this.type = "ffmpeg"
    }

    flatten(): object {
        return {
            type: "ffmpeg",
            cmd: this.cmd,
        }
    }

    async execute(state: CookingState, tools: Kitchen): Promise<void> {
        await tools.ffmpeg.exec([
            ...this.cmd.map(it => resolveTemplate(it, state)),
        ])
    }

    static parse(json: object, context: string): FFMpegStepImpl {
        const result = new FFMpegStepImpl()
        result.cmd = []
        const parts = validate(json, "cmd", Array, context)
        for (const [idx, part] of parts.entries()) {
            if (typeof part !== "string") throw new TypeError(`${context}: cmd index ${idx}: value is not a string`)
            result.cmd.push(part as unknown as template)
        }
        return result
    }
}

export function stepDispatch(ctx: string, object: object): Step {
    const type = validateString(object, "type", ctx)
    switch (type) {
        case "out":
            return OutputStepImpl.parse(object, ctx)
        case "set":
            return SetVariablesStepImpl.parse(object, ctx)
        case "subst":
            return SubstStepImpl.parse(object, ctx)
        case "regex":
            return RegexStepImpl.parse(object, ctx)
        case "ffprobe":
            return FFProbeStepImpl.parse(object, ctx)
        case "ffmpeg":
            return FFMpegStepImpl.parse(object, ctx)
    }
    throw new TypeError(`${ctx}: unknown step type ${type}`)
}


export class InProgressRecipe {
    readonly recipe: Recipe
    state: "wait" | "setup" | "execute" | "error" | "done"
    message: string | undefined
    completed: number
    total: number

    readonly input: TaggedFile
    output: TaggedFile | null

    readonly #forge: Forge

    constructor(recipe: Recipe, forge: Forge, input: TaggedFile) {
        this.#forge = forge
        this.recipe = recipe
        this.state = "wait"
        this.completed = 0
        this.total = recipe.steps.length
        this.input = input
        this.output = null
    }

    #fail(reason: any) {
        console.error(reason)
        this.state = "error"
        this.message = `${reason}`
    }

    /**
     * ## Default Variables
     * - `${file}`: file name IN the container (usually a UUID)
     * - `${name}`: file name OUTSIDE the container (usually what you want to do to derive the result name)
     */
    async execute() {
        try {
            const ffmpeg = await this.#forge.makeFFmpeg()
            await ffmpeg.writeFile(this.input.id, await this.input.file.bytes())
            const state: CookingState = {
                input: this.input,
                output: null,
                recipe: this.recipe,
                variables: {
                    "file": this.input.id,
                    "name": this.input.file.name
                },
            }
            const kitchen: Kitchen = {
                ffmpeg: ffmpeg
            }

            for (const step of this.recipe.steps) {
                await step.execute(state, kitchen)
                this.completed++
            }

            if (!state.output) return this.#fail(Error(`Recipe did not produce any result`))
            this.output = state.output
        } catch (e) {
            this.#fail(e)
        }
    }
}


export class RecipeImpl implements Recipe {
    version!: number;
    name!: string;
    description!: string;
    author!: string;
    steps!: Step[];

    private constructor() {
    }

    flatten(): object {
        return {
            version: this.version,
            name: this.name,
            description: this.description,
            author: this.author,
            steps: this.steps.map(it => it.flatten())
        }
    }

    static parse(json: object): RecipeImpl {
        const result = new RecipeImpl()
        result.version = validateNumber(json, "version", "importing recipe")
        result.name = validateString(json, "name", "importing recipe")
        result.description = validateString(json, "description", "importing recipe")
        result.author = validateString(json, "author", "importing recipe")

        result.steps = []
        const inSteps = validate(json, "steps", Array, "importing recipe");

        for (const [idx, item] of inSteps.entries()) {
            const dispatcher: (object: object) => Step = stepDispatch.bind(null, `importing step #${idx + 1}`)
            result.steps.push(validateRecursive<Step>(item, idx, dispatcher, `importing step #${idx + 1}`))
        }

        return result
    }
}