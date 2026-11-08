# Editable theme rollback

The application returns to the built-in themes from commit `8a8d670`. Migrations 0022–0024 remain in the repository because they have already been deployed; do not remove their migration records or reuse their numbers. The old code ignores `themes_table` and `aiThemeColorModel`.

## Production rollout

1. Back up the production database, including `themes_table`, `forms_table`, and `app_settings_table`. Custom palettes, changes to built-in palettes, deleted-theme flags, and custom theme assignments will no longer be used. Keep the backup if these need to be restored later.
2. Pause theme and form-settings changes while performing the rollout. Inspect the affected forms and decide which built-in theme each should use. `default` is a legacy value and resolves to `ocean` in the application:

   ```sql
   SELECT theme, COUNT(*) AS form_count
   FROM forms_table
   GROUP BY theme
   ORDER BY theme;

   SELECT id, title, base_css, is_deleted
   FROM themes_table;
   ```

3. Deploy the rollback. Until assignments are changed, unknown IDs render with the `ocean` fallback, but the settings selector cannot display them correctly. Built-in theme overrides immediately return to their original colors. Assign affected forms to built-in themes in the UI, or have the database operator run the following after reviewing the affected rows. This example maps every non-built-in ID, including `cream-gold`, to `ocean`:

   ```sql
   SELECT id, theme FROM forms_table
   WHERE theme NOT IN ('default', 'dark', 'ocean', 'forest', 'unicorn', 'orange', 'lightning', 'botulina-pink');

   UPDATE forms_table SET theme = 'ocean'
   WHERE theme NOT IN ('default', 'dark', 'ocean', 'forest', 'unicorn', 'orange', 'lightning', 'botulina-pink');
   ```

4. Verify filling and printing representative forms and check their settings. Resume form-settings changes. The unused table and setting can safely remain. If permanent cleanup is desired, after the backup and verification, a database operator may run:

   ```sql
   DROP TABLE themes_table;
   DELETE FROM app_settings_table WHERE `key` = 'aiThemeColorModel';
   ```

   Dropping the table permanently removes custom palettes and overrides. Fresh databases that apply the retained historical migrations will create the unused table; it can be left in place or removed using the same cleanup step. Do not delete migration tracking rows: future migrations must continue after 0024.
