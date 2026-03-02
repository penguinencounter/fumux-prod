# `x-replace` custom element

- `display: none`
- replace with actual element determined by `type`
- bind to name `name` (unique)
  - or, `list` (nonunique)

```html
<!-- .arg: ArgumentEditor -->
<x-replace type="argument-editor" name="arg"></x-replace>

<!-- .ffmpegs: ArgumentEditor[] -->
<x-replace type="argument-editor" list="ffmpegs"></x-replace>
<x-replace type="argument-editor" list="ffmpegs"></x-replace>
<x-replace type="argument-editor" list="ffmpegs"></x-replace>
```

## Keys

- `argument-edtior` to `ArgumentEditor` (`argument_editor.ts`)