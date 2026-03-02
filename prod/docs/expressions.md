The expression language is used to determine which branch of a `"branch"` step to take.
It supports four types of data: strings, numbers, booleans, and `undefined`.

Each expression runs in a *context*, where variables are numbered starting from 0. Variable names are not supported.
## Value expressions
- numbers, which can be positive or negative, support decimals, and support exponents (`e` notation)
- strings, which do not support escape characters but the starting and ending quotes can have any number of the same quote:
    - `'Hello, world!'`
    - `''Isn't it nice?''`
    - `"Double quotes work too"`
    - `"""Python moment. "docstrings" are valid. however, you cannot put newlines in them"""`
- booleans, via the keywords `true` and `false`
- variables, which are converted to numbers if they look like numbers and are otherwise strings: `$0`
- the *ifdef* "operator" is technically a value. it is `true` if the variable is defined: `$?0`
- there is also the corresponding *ifndef* "operator", which is the opposite: `$!0`

## Operators
- you've got your standard grouping parentheses
- `+`, `*`, and `/`
    - all math operators attempt to coerce their inputs to numbers
    - `+` is for math only and not string concatenation
- unary `-`
    - yes, this means that to subtract two numbers you have to do `3 + -2`. i couldn't figure out how to get both unary `-` and subtraction working in time
- `==` and `!=`
    - strict matching (types have to be the same)
- `>`, `>=`, `<`, `<=`
    - coerce both sides to a number, then compare
- `&&` and `||`
    - logical and / or
    - same behavior as JS where it actually results in the value of one of the arguments, instead of `true` or `false`
- `&`
    - string concatenation
- unary `!`
    - coerce to boolean, then invert
    - `!!` to coerce to boolean but not invert

## Examples
- does the variable not exist? `$!0`
- `$0 >= 720`
- `$!0 || $!1`