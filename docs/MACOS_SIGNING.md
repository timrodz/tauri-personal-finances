# MacOS Code Signing & Notarization Guide

To distribute your application on macOS without users seeing "Metadata cannot be verified" or "Malicious software" warnings, you must **sign** and **notarize** your application.

## 1. Prerequisites

- **Apple Developer Program Enrolment**: You must pay the ~$99 USD/year fee at [developer.apple.com](https://developer.apple.com/).
- A Mac computer (to generate certificates).

## 2. Generate Certificates

1. Open **Xcode** > Settings > Accounts.
2. Add your Apple ID.
3. Select your team and click **Manage Certificates**.
4. Click **(+)** and select **Developer ID Application** (this is for distributing outside the App Store).
   - _Note: Do not use "Apple Distribution" or "Mac Development" for direct downloads._

## 3. Export Certificate

1. Open **Keychain Access** app on your Mac.
2. Select "My Certificates" or "Login" keychain.
3. Find the certificate named **"Developer ID Application: Your Name (TEAMID)"**.
4. Right-click it and select **Export**.
5. File format: `.p12`.
6. **Important**: Set a strong password for the file when asked.
7. Save this file as `certificate.p12`.
8. Convert this file to a base64 string to store in GitHub:
   ```bash
   openssl base64 -in certificate.p12 -out certificate_base64.txt
   ```
   (Copy the content of `certificate_base64.txt`).

## 4. App-Specific Password (For Notarization)

1. Go to [appleid.apple.com](https://appleid.apple.com/).
2. Sign in > Sign-In and Security > App-Specific Passwords.
3. Generate a new one (e.g., named "GitHub CI").
4. Copy the password (format: `xxxx-xxxx-xxxx-xxxx`).

## 5. Configure GitHub Secrets

Go to your project on GitHub: **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.

Add the following secrets:

| Secret Name                  | Value                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `APPLE_CERTIFICATE`          | The **Base64 string** of your `.p12` file (from Step 3.8).                                                                 |
| `APPLE_CERTIFICATE_PASSWORD` | The password you set when exporting the `.p12`.                                                                            |
| `APPLE_SIGNING_IDENTITY`     | The Common Name of the cert e.g., `Developer ID Application: Your Name (TEAMID)`. (Optional if you only have one identity) |
| `APPLE_ID`                   | Your Apple ID email address (e.g., `tim@example.com`).                                                                     |
| `APPLE_APP_PASSWORD`         | The **App-Specific Password** from Step 4 (NOT your real password).                                                        |
| `APPLE_TEAM_ID`              | Your 10-character Team ID (found in Apple Developer portal top right).                                                     |

## 6. How it works

The `release.yml` workflow passes these secrets to `tauri-action`.

- If these secrets are present, `tauri-action` automatically signs the `.app` and `.dmg`.
- It then uploads them to Apple's notarization service.
- If successful, it "staples" the ticket to the app, making it safe for anyone to run.
