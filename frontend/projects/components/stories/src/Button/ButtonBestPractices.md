### Best practices

#### Do

- Use one primary button per view for the main action.
- Use `<a sx-button>` for navigation and `<button sx-button type="button">` for actions.
- Give icon-only buttons an `aria-label`.
- Set `busy` while an action runs; the label stays as the accessible name.

#### Don't

- Don't use danger for anything that can be undone.
- Don't disable a button without saying why nearby.
