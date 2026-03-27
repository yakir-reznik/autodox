## Bugs

- [ ] Dragging elements into repeater is kind of hard
- [x] Signature fields inside repeater don't export in pdf
- [x] What the hell happens when repeater field is marked is required? - basically nothing - removed this prop from repeater fields
- [x] Field name appears twice for repeater field in properties in FormBuilder
- [x] "Allow other/another option" in checkbox list doesn't work - when adding new option auto check it
- [x] Cannot put links in paragraph element. The links appear on the fill page, but they are not clickable
- [x] When duplicating a required field it shows the duplicated field with a red asterisk but it is not required.
- [x] No selection visible on repeater fields in FormBuilder
- [x] When creating a new user we need to generate an API key for them. after re-rolling key we need to hard reload or include new key in session data

## Features

- [ ] Add feature to add name to a submission and show it in the table view and submission detail view
- [ ] Add "submission created" message in create new submission modal and add buttons: view submission (open in new tab), copy link, view all form submissions
- [ ] Allow saving without submitting. Also allow saving while form is only partially filled. Max 1 save per user per form and it should expire after 30 days. new save overwrites last one. (Plan file ready - save-submission-drafts.md)
- [ ] Help text appears beneath radio buttons it needs to be between the title and the radio buttons
- [x] In submission-detail view - add a button to resend the webhook.
- [x] Use the new BaseCopyButton instead of other copy buttons across the app
- [x] Update json upload schema with new elements recently added
- [x] Button to view / copy typescript type (schema) of form submission result (based on fields from formbuilder)
- [x] Add "autocomplete" property to some fields that it makes sense like "input" / "phone" / "email". also add it to the propmt for gpt schema. @pages/forms/upload?formId=7
- [x] Add defineable initial values for all field types
- [x] We need a phone number input field
- [x] Add link to print view on submission page (the view puppeteer uses)
- [x] Display field value somewhere else in the form, like firstName from the top of the form at the bottom of the form next to the signature field.
- [x] Long checkbox list - allow setting to show in columns
- [ ] Checkboxes list (SelectionElement) add feature where user can define min and max count of checkboxes form filler is allowed to select.
- [ ] radio cards - new field type
- [ ] Generate a QR code for submission link (generic or with token)
- [ ] Users can only see their own forms and submissions, Admins can see every users forms
- [ ] Calculated fields, Auto-sum, scores, pricing, percentages
- [ ] Reusable blocks - Save a section as a reusable component
- [ ] Multi-step / wizard forms, Progress bar, step logic
- [ ] File upload field type
- [ ] Form versioning
- [ ] View historical versions
- [ ] Multi-signer workflows: Signer A → then Signer B → then internal approval, Audit trail
- [ ] Role-based signers: “Client”, “Witness”, “Company Rep”
- [ ] Signer identity verification: Email verification, SMS OTP
- [ ] Bulk export of submissions
- [ ] Sending emails on submission (or other events)
- [ ] Custom thank-you pages
- [ ] Multi-language forms - Per form or per submission
- [x] Be able to delete (archive / soft delete) forms
- [x] Form to create a new submission with overrides for form settings
- [x] Ability to define wether or not to post pdf to submission webhook - settings in form level and ability to override in submission level
- [x] Ability to define webhook url setting in form level and ability to override in submission level

## Tasks

- [x] I tried submitting a form with a fake webook. i see "attempt 2" failed. can't see attempt #1
- [x] Add UI to track webhook posting per submission
- [x] In submission-details route show info if webhook submission succeeded or not
- [x] Allow admin user to manage forms by directories: Some folder > multiple forms. Admin should be able to rename folders, move forms between folders, delete folders, etc...
- [x] When creating a new form the drag and drop does not work, dragging an element to the blank canvas does not work. Cliking on an element does work.
- [x] Section element should not contain title by default, if i want a title inside of it i will add a heading element manually
- [x] We need a way to group elements togther and only show them if a checkbox is checked. For example: "Are you pregnant" if this is checked i want to show a group of other fields such as "What week are you"
- [] We want the exported pdf to look as close the the digital for as possible
- [x] We want a feature where i can define forms that are password protected - meaning when a user tries to enter a submission link they need to enter a password. i want to be able to pass a password in the create-submission-link endpoint. if a form is not password protected and a password is passed - make the single submission password protected.
- [x] Create a feature where an admin user can paste a json structure of the form structure and the form will be created from the json. Basically admin users will upload an actual pdf to chatgpt and ask it to generate json output of the form structure. I want the admins to upload that output to our system to quick create forms. In the screen where the admins will do this you need to also write the required json structure so users can copy-paste it to chatgpt.
- [x] When i try to fill a form without a token it fails and shows error when trying to submit. I want to have a setting in the FormSettingsModal that we can define if a form is accessible to everyone or only users with a a link with a token. come up with a good way to pharse this to the users. If its allowed to submit without a token - generate a unique token on submission, I also want to track these kind of submissions somehow in the database. and in the submissions list view @app/components/form-builder/FormSettingsModal.vue  
       @app/pages/submissions/ @server/api/submissions/ @app/pages/fill/
