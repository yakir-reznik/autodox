## Features

- [ ] Show/hide fields or sections based on previous answers
- [ ] Required-if rules
- [ ] Calculated fields, Auto-sum, scores, pricing, percentages
- [ ] Reusable blocks - Save a section as a reusable component
- [ ] Multi-step / wizard forms, Progress bar, step logic
- [ ] File upload field type
- [ ] radio cards - new field type
- [ ] Form versioning
- [ ] View historical versions
- [ ] Multi-signer workflows: Signer A → then Signer B → then internal approval, Audit trail
- [ ] Role-based signers: “Client”, “Witness”, “Company Rep”
- [ ] Signer identity verification: Email verification, SMS OTP
- [ ] Bulk export of submissions
- [ ] Sending emails on submission (or other events)
- [ ] Custom thank-you pages
- [ ] Multi-language forms - Per form or per submission

## Tasks

- [x] Add UI to track webhook posting per submission
- [x] In submission-details route show info if webhook submission succeeded or not
- [x] Allow admin user to manage forms by directories: Some folder > multiple forms. Admin should be able to rename folders, move forms between folders, delete folders, etc...
- [x] When creating a new form the drag and drop does not work, dragging an element to the blank canvas does not work. Cliking on an element does work.
- [x] Section element should not contain title by default, if i want a title inside of it i will add a heading element manually
- [] We need a way to group elements togther and only show them if a checkbox is checked. For example: "Are you pregnant" if this is checked i want to show a group of other fields such as "What week are you"
- [] We want the exported pdf to look as close the the digital for as possible
- [x] We want a feature where i can define forms that are password protected - meaning when a user tries to enter a submission link they need to enter a password. i want to be able to pass a password in the create-submission-link endpoint. if a form is not password protected and a password is passed - make the single submission password protected.
- [x] Create a feature where an admin user can paste a json structure of the form structure and the form will be created from the json. Basically admin users will upload an actual pdf to chatgpt and ask it to generate json output of the form structure. I want the admins to upload that output to our system to quick create forms. In the screen where the admins will do this you need to also write the required json structure so users can copy-paste it to chatgpt.
- [x] When i try to fill a form without a token it fails and shows error when trying to submit. I want to have a  
       setting in the FormSettingsModal that we can define if a form is accessible to everyone or only users with a  
       link with a token. come up with a good way to pharse this to the users. If its allowed to submit without a  
       token - generate a unique token on submission, I also want to track these kind of submissions somehow in the  
       database. and in the submissions list view @app/components/form-builder/FormSettingsModal.vue  
       @app/pages/submissions/ @server/api/submissions/ @app/pages/fill/
