import "./Button.css";

export default function Button({ variant = "primary", className = "", children, ...props }) {
  return (
    <button type="button" className={`btn btn--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}