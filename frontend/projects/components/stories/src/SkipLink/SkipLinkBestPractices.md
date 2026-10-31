### Best practices

#### Do

- Render it once, as the first element in the app shell.
- Point `target` at the `<main>` element's id.

#### Don't

- Don't hide it with `display: none`; it must stay focusable.
- Don't add more skip links than the page needs.
