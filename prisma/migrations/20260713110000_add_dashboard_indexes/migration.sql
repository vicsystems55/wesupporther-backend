-- Rename the existing table without dropping volunteer application data.
RENAME TABLE `VolunteerApplication` TO `volunteer_applications`;

-- Add indexes used by volunteer dashboard filtering and newest-first sorting.
CREATE INDEX `volunteer_applications_status_createdAt_idx`
    ON `volunteer_applications`(`status`, `createdAt`);
CREATE INDEX `volunteer_applications_email_idx`
    ON `volunteer_applications`(`email`);

-- Replace the single-column status index with the dashboard composite index.
DROP INDEX `newsletter_subscribers_status_idx` ON `newsletter_subscribers`;
CREATE INDEX `newsletter_subscribers_status_subscribedAt_idx`
    ON `newsletter_subscribers`(`status`, `subscribedAt`);
