A toast tells people about something that just happened, such as "Feed link copied". Raise it with
`ToastService.show({ kind, title, text?, action? })`; `ToastRegion`, rendered once by the app shell, shows it in a
polite live region at the bottom of the screen. Info, success and warning toasts dismiss themselves after 8 seconds,
pausing while hovered or focused; danger toasts use `role="alert"` and stay until dismissed. At most three show,
newest at the bottom (L2-074).
