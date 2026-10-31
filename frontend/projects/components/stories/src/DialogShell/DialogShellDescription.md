The dialog shell is the surface of every dialog opened with Angular CDK `Dialog`: a header with the title (`<h2>`) and Close, the body, and an optional sticky footer (`[slot=footer]`). Open it with `modalDialogConfig()` or `sheetDialogConfig()` and pass its `titleId` as `ariaLabelledBy`. CDK Dialog traps focus, closes on Escape and returns focus to the trigger (L2-091).

Set `tone="danger"` for a destructive confirmation, such as cancelling an event: the header shows the warning icon.
