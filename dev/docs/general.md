You'll need to know these regardless of which recipe type you're working with.

## Template strings

Quite a few places in fumux work with *template strings*, which can have *variable substitutions* in them.

Variable substitutions look like this:
- `${in}` - variable `in`
- `${file}` - variable `file`
- `${name}` - variable `name`

They can also look like this, which leads to some Gotchas:
<ul>
<li><code>${ in }</code> - variable <code>&nbsp;in&nbsp;</code>, <i>with the spaces as part of the name</i></li>
</ul>

If you want to type `${}` anywhere literally, you can escape the `$` using a second `$`:
- `$${in}` - resolves to literal `${in}`
- `$$${in}` - resolves to literal `$`, then the variable `in`

The process of executing substitutions and escape characters is called **resolving** the template.
If a necessary variable isn't present when the template is **resolved**, the entire recipe ends in an error:

```
error! Error: Encountered variable 'varname' in template, but that variable is not defined yet
```
