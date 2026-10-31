### Best practices

#### Do

- Leave icons decorative (the default) when a visible label sits next to them.
- Pass `label` when the icon alone carries meaning, such as a streaming marker without text.
- Use `size="sm"` inside dense metadata rows and `size="lg"` in empty states.

#### Don't

- Don't use an icon as the only way to tell states apart; pair it with text or an accessible name.
- Don't recolour icons with hex values; set `color` from a token on the parent.
