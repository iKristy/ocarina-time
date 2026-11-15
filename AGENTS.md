<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Render the ocarina as an inline SVG with its sequence positioned in the same aspect-ratio container, so the instrument and notes stay aligned across screen sizes.
- Reuse the instrument SVG for glow previews, scope preset tokens to each display, and save validated preset IDs in a first-party cookie after hydration so settings stay device-local without changing audio or recording.
- Keep song beat data and lazy browser audio synthesis in a shared playback module; schedule voices on the audio clock so per-song rhythms remain accurate and playback can be interrupted.
- Keep song row content at fixed geometry; crossfade idle and selected frames with matching scale transitions, and animate border color on a separate inner layer so playback and hover never reposition the frame.
- Draw song keyboard focus on a separate pseudo-element sharing the frame's scale; change only border colors on press and remove scroll fades during focus so indicators remain aligned and visible without moving content.
- Keep home-screen support manifest-only with PNG and maskable icons; add no app-shell service worker unless offline support is explicitly requested, to avoid stale preview caches.
- Store the eight-note custom Scarecrow sequence in a validated first-party cookie, read after hydration; reuse shared audio-clock playback, keep reset separate from the song button to avoid nested controls, and let the tile itself toggle recording off (discarding the draft) rather than nesting a second control.
