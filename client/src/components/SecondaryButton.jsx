// One reusable button style. Instead of a CSS class, we make a component.
// "...props" passes along anything else (onClick, disabled, children, ...).
function SecondaryButton({ className = "", ...props }) {
  return (
    <button
      type="button"
      className={`cursor-pointer rounded-[10px] border-[1.5px] border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-900 transition-colors hover:enabled:border-stone-900 hover:enabled:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      {...props}
    />
  );
}

export default SecondaryButton;