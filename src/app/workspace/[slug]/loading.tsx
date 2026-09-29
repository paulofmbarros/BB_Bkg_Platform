export default function WorkspaceLoading() {
  return (
    <div className="workspace-loading" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading page…</span>
      <div className="workspace-loading-heading">
        <span />
        <strong />
        <small />
      </div>
      <div className="workspace-loading-panel">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
