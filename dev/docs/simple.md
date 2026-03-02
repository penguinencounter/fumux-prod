> [!WARNING]
> You probably shouldn't be writing these yourself unless you have a very specific use-case. (ex. wanting to distribute your recipes and change the author and description.) There's an editor for the simple recipe format built into the app:
>
> - select an existing recipe and click the blue Edit (pencil icon) button in the toolbar
> - create a new recipe by clicking the "New simple recipe" card
>
> If you do want to change some of the additional properties, you can use the Share/Export action (yellow toolbar button) to download the recipe file.

## Example
(This is the built-in "H.264" recipe, minus the special field for builtins.)

```json
{
  "author": "PenguinEncounter",
  "shortDescription": "Best-effort conversion to h.264 .mp4",
  "name": "H.264",
  "parser": "simple",
  "version": 1,
  "argumentList": [
    "-i",
    "${in}",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-vf",
    "format=yuv420p",
    "${out}"
  ],
  "fileExtensionStyle": "append",
  "fileExtension": "mp4"
}
```

## Schema
- *root object*
    - **required** `"version": number` - Set this to `1`.
    - **required** `"parser": "simple"` - Differentiates which parser to use to load this recipe. You're reading the simple recipe documentation.
    - **required** `"name": string` - Name of the recipe.
    - *optional* `"shortDescription": string` - Short description of the recipe. Displayed on the recipe card and in the full recipe view. Also displayed on the recipe selector button, if no long description is available.
    - *optional* `"longDescription": string` - Longer description of the recipe. Displayed in the full recipe view, alongside the short description. Displayed on the recipe selector button.
    - *optional* `"author": string` - However the recipe's creator wants to identify themselves.
    - **required template** `"argumentList": string[]` - Argument list to be sent to FFmpeg to process the file. See below for details.
    - *optional* `"fileExtension": string` - Target file extension (i.e. the extension of the file type you're converting *to*); do not include the dot (i.e. value should be `wav`, not `.wav`)
    - **required** `"fileExtensionStyle": "append" | "replace"` - How to modify filenames when processing the file. This is required, despite not doing anything if `fileExtension` is omitted. Just go with it. See below for details.

## The argument list

> [!NOTE]
> You should read the [general concepts](./general.md) page first, if you haven't already.

The `argumentList` is a *list of **templates***, and they are resolved when the recipe executes.
The simple recipe compiler provides **two variables** in an official capacity:
- **in** (`${in}`) contains the input filename, as seen by ffmpeg. You'll probably want to do something like `"-i", "${in}"`.
- **out** (`${out}`) contains the output filename to be used by ffmpeg. If this file is not created once the command completes, the recipe fails. The output filename is guaranteed to have the specified `fileExtension`, if any is specified.

You can technically also use the two default variables, but they will not be correctly highlighted in the in-app editor:
- **file** (`${file}`) is equivalent to **in**
- **name** (`${name}`) is the *input* filename (i.e. the name of the original file used for input.)

## The file extension style

The `fileExtensionStyle` determines how the final name of the output file is computed from the input file name.
It is always required, despite having no effect if `fileExtension` is not specified.

- `"append"`: append the new extension to the file; `file.mp3` → `file.mp3.wav`.
- `"replace"`: replace the current extension with the new one; `file.mp3` → `file.wav`. If there is no suitable extension, append the new extension instead.