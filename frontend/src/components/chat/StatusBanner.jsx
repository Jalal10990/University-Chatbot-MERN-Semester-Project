export default function StatusBanner({ variant = "info", title, children, action }) {
  return (
    <div className={`banner banner--${variant}`} role={variant === "error" ? "alert" : "status"}>
      <div className="banner__body">
        <strong className="banner__title">{title}</strong>
        {children && <p className="banner__text">{children}</p>}
      </div>
      {action && (
        <button type="button" className="banner__action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}