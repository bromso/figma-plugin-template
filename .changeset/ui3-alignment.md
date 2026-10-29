---
"@repo/ui": minor
---

Align the component library with Figma's UI3 design system. Tokens now bind to the `--figma-color-*` variables Figma injects (with kit fallbacks), the global scale is 24 px controls / 11 px Inter 450 / 5 px radius, and sixteen components match the UI3 kit: Button, Input, Textarea, Checkbox, RadioGroup, Switch, Select, Tabs, Badge, Tooltip, DropdownMenu, ContextMenu, Menubar, Command, Dialog, AlertDialog. Menus are dark in both themes like Figma's. Storybook gains a theme toggle and `UI3/*` parity stories. The plugin window defaults to 320 × 480. Badge `default` is now the neutral outlined kit style (it was a filled brand pill); `secondary` is the selected tint with brand text; `ghost` is the filled secondary.
