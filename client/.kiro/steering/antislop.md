# Anti Slop: Rules for AI Coding Agents

## 1. Core Directives
- DO NOT use purple, blue, or pink gradient text/backgrounds for hero sections.
- DO NOT center-align large hero text blocks over exactly three rounded feature cards.
- DO NOT use glassy, blur-filtered (backdrop-blur) fixed navigation bars by default.
- DO NOT use corporate AI slang ("delve", "tapestry", "revolutionize", "seamlessly", "furthermore").
- DO favor high-contrast asymmetrical grid sections, uneven column spans, and varied typography weights.
- DO favor active human phrasing instead of nominalizations ("we pay users" over "a payment mechanism is provided").

## 2. Component Layout Controls
- Card Structures: Vary border-radius properties manually. Do not fall back to `rounded-lg` or `rounded-xl` universally. Use sharp corners (`rounded-none`) or subtle offsets to introduce deliberate brand character.
- Spacing & Flow: Introduce asymmetry. Use varied paddings and margins instead of perfectly uniform flex spaces.

## 3. The Delivery Gate
- Before marking any frontend task as finished, run a lint check against standard AI layouts. If the layout resembles a generic 2024 Tailwind landing page template, reject it and rebuild.
