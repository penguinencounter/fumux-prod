# Example
You deserve an example to see just what you're about to get into. Here's that 720p recipe that's built-in (Yes it's freaking huge):

```json
{
  "author": "PenguinEncounter",
  "shortDescription": "Shrink input video to 720p (or upscale, I guess)",
  "longDescription": "Convert the input such that its video is 720px in height. Maintains aspect ratio.",
  "name": "720p",
  "parser": "complex",
  "version": 1,
  "steps": [
    {
      "type": "regex",
      "input": "${name}",
      "pattern": "(\\.[a-zA-Z0-9-_]+?)$",
      "flagM": false, "flagI": false, "flagS": false,
      "outputs": {
        "1": "ext"
      }
    },
    {
      "type": "subst",
      "input": "${name}",
      "pattern": "(\\.[a-zA-Z0-9-_]+?)$|(.)$",
      "flagM": false, "flagI": false, "flagS": false,
      "repl": "$2_720$1",
      "output": "out"
    },
    {
      "type": "branch",
      "variables": [
        "ext"
      ],
      "branches": [
        {
          "expr": "$!0",
          "actions": [
            {
              "type": "set",
              "vars": {
                "ext": ""
              }
            }
          ]
        }
      ]
    },
    {
      "type": "ffmpeg",
      "cmd": [
        "-i",
        "${file}",
        "-vf",
        "scale=-2:720",
        "output${ext}"
      ]
    },
    {
      "type": "out",
      "file": "output${ext}",
      "name": "${out}"
    }
  ]
}
```

# Schema
- *root object*
    - **required** `"version": number` - Set this to `1`.
    - **required** `"parser": "complex"` - Differentiates which parser to use to load this recipe. You're reading the complex recipe documentation.
    - **required** `"name": string` - Name of the recipe.
    - *optional* `"shortDescription": string` - Short description of the recipe. Displayed on the recipe card and in the full recipe view. Also displayed on the recipe selector button, if no long description is available.
    - *optional* `"longDescription": string` - Longer description of the recipe. Displayed in the full recipe view, alongside the short description. Displayed on the recipe selector button.
    - *optional* `"author": string` - However the recipe's creator wants to identify themselves.
    - **required** `"steps": Step[]` - List of steps to perform. See below (!!)

# Anatomy of a Complex Recipe

I've listed the steps below in rough order of importance. All steps are a JSON object, with at least the `"type"` key to differentiate which ... type ... of step it is.

## `"out"` - produce output

the `"out"` step reads the specified file and presents it as the result of the recipe. it also sets the user-facing filename of the resulting file. the internal filename (`file`) and the external filename (`name`) are resolved when this step is executed.
### Schema
- **required** `"type": "out"`
- **required template** `"file": string`
- **required template** `"name": string`

## `"ffmpeg"` - invoke FFmpeg

Runs `ffmpeg` with the specified argument list. Each argument is resolved when this step is executed.
### Schema
- **required** `"type": "ffmpeg"`
- **required template** `"cmd": string[]`

## `"set"` - bulk variable assignment

Want to prime some constants or do some simple string manipulation? This is the one for you.
For each entry in the `vars` table, the value is *resolved*, then the variable name referenced by the key is set to the resolved value.
### Example
set the `message` variable to `Hello` and then the filename:
```json
{
  "type": "set",
  "vars": {
    "message": "Hello, ${name}!!"
  }
}
```
### Schema
- **required** `"type": "set"`
- **required** `"vars"`: object with **template** values

## `"subst"` - regular expression substitution

This is the tool of choice for manipulating values. It performs regular expression replacement on an input template and writes the result to a variable.

This uses the JavaScript regular expression engine.
### Example
append `_720` to the file name, just before the file extension:
```json
{
  "type": "subst",
  "input": "${name}",
  "pattern": "(\\.[a-zA-Z0-9-_]+?)$|(.)$",
  "flagM": false, "flagI": false, "flagS": false,
  "repl": "$2_720$1",
  "output": "out"
}
```
### Schema
- **required** `"type": "subst"`
- **required template** `"input": string` - input string to match against
- **required** `"pattern": string` - regular expression to match and perform replacement with. The `g` (global) flag is always **enabled**.
- **required** `"flagM": boolean` - whether the `m` (multiline) flag is enabled
- **required** `"flagI": boolean` - whether the `i` (case-insensitive) flag is enabled
- **required** `"flagS": boolean` - whether the `s` (multiline) flag is enabled
- **required** `"repl": string` - replacement string ([JavaScript replacement syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_the_replacement))
- **required** `"output": string` - name of variable to place the result in

## `"regex"` - regular expression matching & groups

Similar to `"subst"`, but better for extracting information from a larger input. If the regular expression does not match, **no variables are set**.
### Example
get the file extension of the input file, if any:
```json
{
  "type": "regex",
  "input": "${name}",
  "pattern": "(\\.[a-zA-Z0-9-_]+?)$",
  "flagM": false, "flagI": false, "flagS": false,
  "outputs": {
	"1": "ext"
  }
}
```
### Schema
- **required** `"type": "regex"`
- **required template** `"input": string` - input string to match against
- **required** `"pattern": string` - regular expression to match and perform replacement with. The `g` (global) flag is always **disabled**.
- **required** `"flagM": boolean` - whether the `m` (multiline) flag is enabled
- **required** `"flagI": boolean` - whether the `i` (case-insensitive) flag is enabled
- **required** `"flagS": boolean` - whether the `s` (multiline) flag is enabled
- **required** `"outputs": object`
    - keys are stringified integers representing the group to read
    - values are the name of the variable to put the matched group into
    - if the specified group is not matched, the variable is not set
    - group 0 (i.e. `"0"`) is the entire match

## `"ffprobe"` - invoke FFprobe
FFprobe is FFmpeg's companion program that focuses on gathering information about media, rather than changing it. For example, the file descriptions on the fumux main page are powered by this ffprobe command:
```
ffprobe -v error -show_entires stream ${file}
```

FFprobe has its own documentation [on the FFmpeg website](https://ffmpeg.org/ffprobe.html).

### Example
get a whole bunch of information about the audio/video/caption/data streams in the input:
```json
{
  "type": "ffprobe",
  "cmd": ["-v", "error", "-show_entries", "stream", "${file}"],
  "out": "probe"
}
```
### Schema
- **required** `"type": "ffprobe"`
- **required template** `"cmd": string[]` - same handling as `"ffmpeg"` above. do not specify `-o`; that will be done for you
- **required** `"out": string` - variable to write the output to

## `"branch"` - conditionally run steps

`branch` is pretty much the [`when` statement from Kotlin](https://kotlinlang.org/docs/control-flow.html#when-expressions-and-statements) without a subject. It runs the first branch that has a truthy (as in JavaScript) condition.

Conditions are built on the [expression language](./expressions.md).
The `variables` array maps variables (as in `${these}`) to expression variables (as in `$0`). It's zero-indexed.
### Example
Set the `ext` variable if it isn't defined:
```json
{
  "type": "branch",
  "variables": [
	"ext"
  ],
  "branches": [
	{
	  "expr": "$!0",
	  "actions": [
		{
		  "type": "set",
		  "vars": {
			"ext": ""
		  }
		}
	  ]
	}
  ]
}
```
### Schema
- *(root object)*:
    - **required** `"type": "branch"`
    - **required** `"variables": string[]` - variables to bind to expression environment.
        - notably **not** templates. specify variable names only. undefined variables **do not error**; they are just undefined in the expression environment.
    - **required** `"branches": Branch[]` - zero or more branches; see below
- *(defn. `Branch`):*
    - **required** `"expr": string` - expression language expression to evaluate
    - **required** `"actions": Step[]` - list of steps to take if the expression evaluates to a truthy value

## `"error"` - cause an error

It does what it says! this doesn't really make sense outside of the `branch` instruction.

### Schema
- **required** `"type": "error"`
- **required template** `"reason": string`