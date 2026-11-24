import Icon from './Icon.jsx';

export default function Notice({ icon, title, text, action, onAction, danger }) {
  return (
    <div
      role={danger ? 'alert' : undefined}
      className="flex flex-col items-center gap-2 rounded-3xl bg-paper/60 px-6 py-10 text-center"
    >
      <span
        className={`grid h-12 w-12 place-items-center rounded-full text-paper ${danger ? 'bg-ruby' : 'bg-navy'}`}
      >
        <Icon name={icon} size={22} />
      </span>
      <h3 className="m-0 font-display text-xl font-bold">{title}</h3>
      <p className="m-0 max-w-xs text-sm text-navy-soft">{text}</p>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="hit mt-2 rounded-full border border-line px-4 py-2 text-sm font-semibold"
        >
          {action}
        </button>
      )}
    </div>
  );
}