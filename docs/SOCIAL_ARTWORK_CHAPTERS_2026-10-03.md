# Profile Artwork and Chapter Discussion

## Implemented

- Visitor profiles fetch the owner's current custom covers and character portraits. Viewer-local artwork is never used for another reader's shelves.
- Public artwork RPC exposes only images referenced by public favorites or library, and checks authentication, account privacy, and blocking in both directions. Character IDs and keys are both supported.
- Chapter reviews have their own server table and publish RPC. Opening a chapter shows reader ratings and comments, paginated in groups of 20. Spoilers use a closed disclosure. Readers can report or block an author; owners can delete their published review.
- Existing chapter notes remain private. Publishing is an explicit action, separate from Save privately. It does not create a community post. Existing manually shared posts are not deleted.
- Community replies load the latest page first, with access to older replies. Requests from closed threads or abandoned screens cannot overwrite current content. Failed loads have retry controls rather than fake posts.
- Reply targeting and closing/reopening a thread preserve the draft during this app session. Long text wraps; the composer fits the reduced viewport used for keyboard testing.

## Verification

- Live Supabase migration applied, followed by character-key compatibility correction.
- Transactional live checks used two existing profiles and rolled back all fixture writes: owner artwork projection, no unrelated artwork exposure, private accounts and both-direction blocking, owner chapter upsert without duplicate entries, and anonymous access denied.
- Local controlled chapter fixture verified read retry, failed publish retaining text, successful publish only inside the chapter, spoiler disclosure, and paginated comments without overflow at 375px.
- Actual demo UI checked at 375px with long community posts and replies; the reply composer stayed inside a 480px reduced viewport. Draft targeting and closing/reopening were tested through UI actions.
- Full test suite: 528 tests passed. iOS web assets copied and synchronized.

## Release Boundary

This does not create or upload a new IPA. Existing TestFlight builds do not acquire these client changes until a new build ships. Native iPhone keyboard and multi-device end-to-end artwork upload still need device QA; browser layout and live database privacy checks are not a substitute for it.
Uploaded artwork still uses the existing cloud-synced image representation. This change does not make the private storage bucket public.
