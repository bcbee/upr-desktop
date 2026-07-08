import { Modal } from './Modal'

// Shown only in the unsigned 1.3.2 bridge build on macOS: directs users to the
// signed build on the website so auto-update continuity is preserved going forward.
export function MigrationNotice(): React.JSX.Element {
  return (
    <Modal
      title="Update Available"
      buttonTitle="Download the latest version"
      buttonActive
      canClose
      buttonOnClick={() => window.upr.openExternal('https://universalpresenterremote.com')}
    >
      <div>
        <h1>A new version of UPR is available</h1>
        <p>
          Please download the latest signed version of Universal Presenter Remote from our website
          to keep receiving automatic updates.
        </p>
      </div>
    </Modal>
  )
}
