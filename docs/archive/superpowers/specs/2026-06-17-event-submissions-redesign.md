# Event Submissions Redesign

## Goal

Replace the award event room editor with a simpler submission workflow: writers create or edit normal posts from the existing writer dashboard, then join an event and choose one of their own draft or published posts as their event submission.

This removes duplicated editor state inside events, fixes the confusing private/shared preview behavior, and makes final event publishing use the same post content writers already know how to manage.

## Core Workflow

1. Admin creates and opens an event.
2. Writers can join while the event is `OPEN` or `PUBLISHED`.
3. Each writer has one submission slot per event.
4. A writer selects one of their own `DRAFT` or `PUBLISHED` posts.
5. The writer adds an event-specific introduction.
6. The writer chooses whether the submission is private or shared with participants.
7. The writer saves or submits the entry.
8. Admin publishes or updates the final merged event post.
9. Admin explicitly closes the event when no more writer changes should be accepted.

## Event Lifecycle

- `DRAFT`: Admin setup only. Writers cannot join.
- `OPEN`: Writers can join, select/change posts, edit intros, change visibility, and submit.
- `PUBLISHED`: Final post exists, but the event still accepts writer changes. Writers can still join for the first time and update submissions. Admin can regenerate the final post.
- `CLOSED`: Writer changes are locked. Admin can still view and manage the event.
- `ARCHIVED`: Historical read-only state.

Publishing does not close the event. Closing is a separate admin action.

## Submission Model

The event submission stores event-specific metadata and a reference to a normal post:

- event id
- writer id
- selected post id
- writer introduction
- visibility: private or shared with participants
- status: draft or submitted
- order
- submitted timestamp
- excluded timestamp

The selected post content is not copied into the event submission. Whenever admin publishes or updates the final event article, the system reads the latest saved content from each selected post.

Eligible selected posts are the writer's own posts with status `DRAFT` or `PUBLISHED`.

## Visibility Rules

Private submissions:

- visible to the owner
- visible to admins
- hidden from other writers
- not clickable by other writers

Shared submissions:

- visible to the owner
- visible to admins
- visible to other joined event participants
- preview shows full selected post content

Selecting a private draft for an event does not make that draft public by itself. Draft content is only exposed inside the event according to the submission visibility rules, or in the final public article after admin intentionally publishes or updates the merged post.

## Writer UI

The event page replaces the Tiptap event room editor with:

- join state
- selected post picker for the writer's draft and published posts
- selected post status/title metadata
- writer introduction textarea
- visibility control
- save button
- submit button
- shared participant submissions with full content preview and feedback comments

If the event is `CLOSED` or `ARCHIVED`, writer controls are disabled and the page becomes read-only.

## Admin UI

The admin event detail page shows submissions instead of editor rooms:

- writer name
- selected post title and post status
- submission status
- visibility
- feedback count
- manual reorder controls
- shuffle submitted entries
- preview controls
- publish/update final post
- close event

Admins can preview all submissions, including private ones.

## Final Merged Post

The final event post includes:

1. event introduction
2. entries list
3. one section per submitted, non-excluded submission with a selected post
4. writer name heading
5. event-specific writer introduction
6. latest saved content from the selected post

Only submitted entries are included. Draft event submissions are ignored until submitted.

## Migration Strategy

Reuse the existing award event room table as the submission table where practical, replacing room content usage with a selected `postId`.

Existing event-room editor content is no longer used by the redesigned workflow. The feature is still new, so no importer from room content to posts is required.

## Testing

Cover these behaviors with focused tests:

- writer can join an open or published event
- writer can select only their own draft or published posts
- writer can change selected post while event is open or published
- closed events reject writer updates
- private submissions are hidden from other writers
- shared submissions show full selected post content to participants
- final post generation uses the latest selected post content
- final post generation includes only submitted entries
